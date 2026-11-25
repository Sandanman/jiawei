/**
 * 管理端认证服务（F1）
 */
import { queryOne, query, update, withTransaction } from '../../db'
import { hashPassword, verifyPassword } from '../../utils/password'
import { signAdminToken } from '../../utils/adminJwt'
import { config } from '../../config'
import { BizError } from '../../utils/bizError'
import { writeAudit } from './auditService'
import type { AdminUserRow } from '../../types/admin'
import { formatDateTime } from '../../utils/format'

/** 连续失败锁定阈值与锁定时长 */
const MAX_FAILED = 5
const LOCK_MINUTES = 15

export interface LoginContext {
    ip: string
}

export interface AdminLoginResult {
    token: string
    expiresIn: number
    admin: {
        id: number
        username: string
        nickname: string
    }
}

/**
 * 管理员登录
 * - 账号不存在 / 密码错误统一提示「账号或密码错误」
 * - 连续失败 5 次锁定 15 分钟
 */
export async function adminLogin(
    username: string,
    password: string,
    ctx: LoginContext
): Promise<AdminLoginResult> {
    const admin = await queryOne<AdminUserRow>(
        `SELECT * FROM admin_user WHERE username = ? LIMIT 1`,
        [username]
    )

    if (!admin) {
        throw new BizError('账号或密码错误')
    }

    // 禁用账号先于密码校验，避免泄露账号存在性以外的信息
    if (admin.status !== 1) {
        throw new BizError('账号已被禁用')
    }

    const now = Date.now()
    if (admin.locked_until) {
        const lockedUntil = new Date(admin.locked_until).getTime()
        if (Number.isFinite(lockedUntil) && lockedUntil > now) {
            const minutes = Math.max(1, Math.ceil((lockedUntil - now) / 60000))
            throw new BizError(`账号已锁定，请 ${minutes} 分钟后重试`)
        }
    }

    if (!verifyPassword(password, admin.password_hash)) {
        await handleLoginFailure(admin)
        throw new BizError('账号或密码错误')
    }

    // 登录成功：清零失败计数，更新登录时间
    await update(
        `UPDATE admin_user SET failed_count = 0, locked_until = NULL, last_login_at = NOW() WHERE id = ?`,
        [admin.id]
    )

    const token = signAdminToken({
        adminId: admin.id,
        username: admin.username,
        ver: admin.token_version
    })

    await writeAuditLogin(admin, ctx.ip)

    return {
        token,
        expiresIn: config.adminJwt.expiresInSeconds,
        admin: {
            id: admin.id,
            username: admin.username,
            nickname: admin.nickname
        }
    }
}

/** 登录失败处理：计数 +1，达到阈值锁定 */
async function handleLoginFailure(admin: AdminUserRow): Promise<void> {
    const nextCount = (Number(admin.failed_count) || 0) + 1

    if (nextCount >= MAX_FAILED) {
        await update(
            `UPDATE admin_user
             SET failed_count = 0, locked_until = DATE_ADD(NOW(), INTERVAL ? MINUTE)
             WHERE id = ?`,
            [LOCK_MINUTES, admin.id]
        )
        return
    }

    await update(`UPDATE admin_user SET failed_count = ? WHERE id = ?`, [nextCount, admin.id])
}

/** 写登录审计（独立事务，不阻塞登录结果） */
async function writeAuditLogin(admin: AdminUserRow, ip: string): Promise<void> {
    try {
        await withTransaction(async conn => {
            await writeAudit(conn, {
                adminId: admin.id,
                adminName: admin.username,
                action: 'auth.login',
                targetType: 'admin',
                targetId: admin.id,
                ip
            })
        })
    } catch (err) {
        // 审计失败不阻断登录，但需留痕
        console.error('[ADMIN] 登录审计写入失败:', (err as Error).message)
    }
}

/** 获取当前管理员信息 */
export async function getAdminProfile(adminId: number): Promise<{
    id: number
    username: string
    nickname: string
    lastLoginAt: string | null
}> {
    const admin = await queryOne<AdminUserRow>(
        `SELECT * FROM admin_user WHERE id = ? AND status = 1`,
        [adminId]
    )
    if (!admin) {
        throw new BizError('管理员不存在')
    }

    return {
        id: admin.id,
        username: admin.username,
        nickname: admin.nickname,
        lastLoginAt: formatDateTime(admin.last_login_at)
    }
}

/** 新密码规则：8-64 位且同时包含字母和数字 */
function validateNewPassword(password: string): void {
    const valid = /^[A-Za-z0-9_!@#$%^&*.\-]{8,64}$/.test(password)
        && /[A-Za-z]/.test(password)
        && /\d/.test(password)
    if (!valid) {
        throw new BizError('密码需 8–64 位且同时包含字母和数字')
    }
}

/**
 * 修改自己的密码
 * - 校验旧密码
 * - 不可新旧相同
 * - token_version + 1，写审计
 */
export async function changeAdminPassword(
    adminId: number,
    oldPassword: string,
    newPassword: string,
    ctx: LoginContext
): Promise<void> {
    const admin = await queryOne<AdminUserRow>(
        `SELECT * FROM admin_user WHERE id = ? AND status = 1`,
        [adminId]
    )
    if (!admin) {
        throw new BizError('管理员不存在')
    }

    if (!verifyPassword(oldPassword, admin.password_hash)) {
        throw new BizError('旧密码错误')
    }

    if (oldPassword === newPassword) {
        throw new BizError('新密码不能与旧密码相同')
    }

    validateNewPassword(newPassword)

    const passwordHash = hashPassword(newPassword)

    await withTransaction(async conn => {
        await conn.query(
            `UPDATE admin_user
             SET password_hash = ?, token_version = token_version + 1
             WHERE id = ?`,
            [passwordHash, adminId]
        )
        await writeAudit(conn, {
            adminId: admin.id,
            adminName: admin.username,
            action: 'auth.change_password',
            targetType: 'admin',
            targetId: admin.id,
            ip: ctx.ip
        })
    })
}

/** 供脚本使用：查询管理员是否已存在 */
export async function adminExists(username: string): Promise<boolean> {
    const rows = await query<Array<{ id: number }>>(
        `SELECT id FROM admin_user WHERE username = ? LIMIT 1`,
        [username]
    )
    return rows.length > 0
}
