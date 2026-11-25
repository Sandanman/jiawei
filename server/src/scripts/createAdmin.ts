/**
 * 创建 / 重置管理后台管理员账号
 * 用法：
 *   npm run admin:create -- <username>            # 新建
 *   npm run admin:create -- <username> --reset     # 重置已存在账号的密码
 * 密码来源：优先读环境变量 ADMIN_PASSWORD；否则交互式隐藏输入（不回显、不落盘）
 */
import { createInterface } from 'readline'
import { queryOne, update, pool } from '../db'
import { hashPassword } from '../utils/password'

interface PromptOptions {
    /** 隐藏输入（不回显） */
    hidden?: boolean
}

/** 交互式读取一行；hidden 时逐字符读取且不回显 */
function prompt(question: string, options: PromptOptions = {}): Promise<string> {
    return new Promise(resolve => {
        const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true })
        if (!options.hidden) {
            rl.question(question, answer => {
                rl.close()
                resolve(answer)
            })
            return
        }

        process.stdout.write(question)
        const stdin = process.stdin
        const wasRaw = stdin.isRaw
        stdin.setRawMode?.(true)
        stdin.resume()
        stdin.setEncoding('utf8')

        let value = ''
        const onData = (chunk: string): void => {
            for (const ch of chunk) {
                if (ch === '\n' || ch === '\r' || ch === '\u0004') {
                    stdin.setRawMode?.(wasRaw ?? false)
                    stdin.pause()
                    stdin.removeListener('data', onData)
                    rl.close()
                    process.stdout.write('\n')
                    resolve(value)
                    return
                }
                if (ch === '\u0003') {
                    // Ctrl+C
                    stdin.setRawMode?.(wasRaw ?? false)
                    process.stdout.write('\n')
                    process.exit(1)
                }
                if (ch === '\u007f' || ch === '\b') {
                    value = value.slice(0, -1)
                    continue
                }
                value += ch
            }
        }
        stdin.on('data', onData)
    })
}

function validatePassword(password: string): string | null {
    const valid = /^[A-Za-z0-9_!@#$%^&*.\-]{8,64}$/.test(password)
        && /[A-Za-z]/.test(password)
        && /\d/.test(password)
    return valid ? null : '密码需 8–64 位且同时包含字母和数字'
}

async function main(): Promise<void> {
    const args = process.argv.slice(2)
    const username = (args.find(a => !a.startsWith('--')) || 'admin').trim().slice(0, 32)
    const reset = args.includes('--reset')

    if (!/^[a-zA-Z0-9_]{3,32}$/.test(username)) {
        console.error('用户名需为 3-32 位字母、数字或下划线')
        process.exit(1)
    }

    const existed = await queryOne<{ id: number }>(
        `SELECT id FROM admin_user WHERE username = ? LIMIT 1`,
        [username]
    )
    if (existed && !reset) {
        console.error(`管理员 ${username} 已存在。如需重置密码，请追加 --reset`)
        process.exit(1)
    }

    let password = process.env.ADMIN_PASSWORD || ''
    if (!password) {
        password = await prompt('请输入管理员密码：', { hidden: true })
        const confirm = await prompt('请再次输入确认：', { hidden: true })
        if (password !== confirm) {
            console.error('两次输入的密码不一致')
            process.exit(1)
        }
    }

    const passwordErr = validatePassword(password)
    if (passwordErr) {
        console.error(passwordErr)
        process.exit(1)
    }

    const passwordHash = hashPassword(password)

    if (existed) {
        await update(
            `UPDATE admin_user SET password_hash = ?, token_version = token_version + 1 WHERE id = ?`,
            [passwordHash, existed.id]
        )
        console.log(`已重置管理员 ${username} 的密码，旧登录态已失效。`)
    } else {
        await update(
            `INSERT INTO admin_user (username, password_hash, nickname, status)
             VALUES (?, ?, ?, 1)`,
            [username, passwordHash, username]
        )
        console.log(`已创建管理员 ${username}。`)
    }
}

main()
    .catch(err => {
        console.error('执行失败:', (err as Error).message)
        process.exitCode = 1
    })
    .finally(async () => {
        await pool.end()
    })
