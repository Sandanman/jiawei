/**
 * 管理端用户与账号服务（F4）
 */
import { randomInt } from 'crypto'
import { query, queryOne, withTransaction } from '../../db'
import { BizError } from '../../utils/bizError'
import { hashPassword } from '../../utils/password'
import { writeAudit } from './auditService'
import { escapeLike, maskPhone, toNumber } from '../../controllers/admin/_common'
import { formatDateTime } from '../../utils/format'
import type { AdminIdentity } from '../../types/admin'

interface ListOptions {
    keyword?: string
    status?: string
    createdFrom?: string
    createdTo?: string
    page: number
    pageSize: number
    offset: number
}

interface UserQueryRow {
    id: number
    nickname: string
    avatar_url: string
    phone: string
    status: number
    region_name: string
    family_count: number
    created_at: string | Date
}

/** 用户列表与搜索 */
export async function listUsers(opts: ListOptions): Promise<{
    list: any[]
    total: number
    page: number
    pageSize: number
}> {
    const conditions: string[] = []
    const params: any[] = []

    const keyword = (opts.keyword || '').trim()
    if (keyword) {
        const like = `%${escapeLike(keyword)}%`
        const numericId = /^\d+$/.test(keyword) ? Number(keyword) : 0
        conditions.push(
            `(u.id = ? OR u.nickname LIKE ? OR u.phone LIKE ?
              OR EXISTS (SELECT 1 FROM account a WHERE a.user_id = u.id AND a.username LIKE ?))`
        )
        params.push(numericId, like, like, like)
    }

    if (opts.status === '0' || opts.status === '1') {
        conditions.push('u.status = ?')
        params.push(Number(opts.status))
    }

    if (opts.createdFrom) {
        conditions.push('u.created_at >= ?')
        params.push(`${opts.createdFrom} 00:00:00`)
    }
    if (opts.createdTo) {
        conditions.push('u.created_at <= ?')
        params.push(`${opts.createdTo} 23:59:59`)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const countRow = await queryOne<{ total: number }>(
        `SELECT COUNT(*) AS total FROM user u ${where}`,
        params
    )

    const rows = await query<UserQueryRow[]>(
        `SELECT u.id, u.nickname, u.avatar_url, u.phone, u.status, u.region_name, u.created_at,
                (SELECT COUNT(*) FROM family_member fm WHERE fm.user_id = u.id) AS family_count
         FROM user u
         ${where}
         ORDER BY u.created_at DESC, u.id DESC
         LIMIT ? OFFSET ?`,
        [...params, opts.pageSize, opts.offset]
    )

    return {
        list: rows.map(row => ({
            id: row.id,
            nickname: row.nickname,
            avatarUrl: row.avatar_url || '',
            phone: maskPhone(row.phone),
            status: row.status,
            regionName: row.region_name || '',
            familyCount: toNumber(row.family_count),
            createdAt: formatDateTime(row.created_at)
        })),
        total: toNumber(countRow?.total),
        page: opts.page,
        pageSize: opts.pageSize
    }
}

/** 用户详情 */
export async function getUserDetail(userId: number): Promise<any> {
    const user = await queryOne<{
        id: number
        nickname: string
        avatar_url: string
        phone: string
        status: number
        region_code: string
        region_name: string
        region_source: string
        created_at: string | Date
    }>(
        `SELECT id, nickname, avatar_url, phone, status, region_code, region_name, region_source, created_at
         FROM user WHERE id = ?`,
        [userId]
    )
    if (!user) throw new BizError('用户不存在')

    const account = await queryOne<{
        username: string
        login_type: string
        status: number
        last_login_at: string | Date | null
    }>(
        `SELECT username, login_type, status, last_login_at
         FROM account WHERE user_id = ? ORDER BY id ASC LIMIT 1`,
        [userId]
    )

    const families = await query<Array<{
        family_id: number
        family_name: string
        family_status: number
        role: string
        points: number
    }>>(
        `SELECT fm.family_id, f.family_name, f.status AS family_status, fm.role, fm.points
         FROM family_member fm
         INNER JOIN family f ON f.id = fm.family_id
         WHERE fm.user_id = ?
         ORDER BY fm.joined_at ASC`,
        [userId]
    )

    return {
        id: user.id,
        nickname: user.nickname,
        avatarUrl: user.avatar_url || '',
        phone: user.phone || '',
        status: user.status,
        regionCode: user.region_code || '',
        regionName: user.region_name || '',
        regionSource: user.region_source || '',
        createdAt: formatDateTime(user.created_at),
        account: account
            ? {
                  username: account.username,
                  loginType: account.login_type,
                  status: account.status,
                  lastLoginAt: formatDateTime(account.last_login_at)
              }
            : null,
        families: families.map(row => ({
            familyId: row.family_id,
            familyName: row.family_name,
            familyStatus: row.family_status,
            role: row.role,
            points: toNumber(row.points)
        }))
    }
}

/** 禁用 / 启用用户（高危） */
export async function setUserStatus(
    admin: AdminIdentity,
    userId: number,
    action: 'disable' | 'enable',
    reason: string,
    ip: string
): Promise<{ ownedFamilies?: Array<{ id: number; familyName: string }> }> {
    const targetStatus = action === 'disable' ? 0 : 1
    const fromStatus = action === 'disable' ? 1 : 0
    const conflictMessage = action === 'disable' ? '用户已禁用' : '用户未禁用'

    const user = await queryOne<{ id: number; status: number }>(
        `SELECT id, status FROM user WHERE id = ?`,
        [userId]
    )
    if (!user) throw new BizError('用户不存在')
    if (user.status !== fromStatus) throw new BizError(conflictMessage)

    const ownedFamilies = action === 'disable' ? await getOwnedFamilies(userId) : undefined

    await withTransaction(async conn => {
        const [result] = await conn.query(
            `UPDATE user SET status = ?, updated_at = NOW() WHERE id = ? AND status = ?`,
            [targetStatus, userId, fromStatus]
        )
        if ((result as any).affectedRows === 0) throw new BizError(conflictMessage)

        await writeAudit(conn, {
            adminId: admin.id,
            adminName: admin.username,
            action: action === 'disable' ? 'user.disable' : 'user.enable',
            targetType: 'user',
            targetId: userId,
            reason,
            ip,
            before: { status: fromStatus },
            after: { status: targetStatus }
        })
    })

    return action === 'disable' ? { ownedFamilies } : {}
}

async function getOwnedFamilies(userId: number): Promise<Array<{ id: number; familyName: string }>> {
    const rows = await query<Array<{ id: number; family_name: string }>>(
        `SELECT id, family_name FROM family WHERE owner_id = ? AND status = 1 ORDER BY id ASC`,
        [userId]
    )
    return rows.map(row => ({ id: row.id, familyName: row.family_name }))
}

const PASSWORD_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
const PASSWORD_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz'
const PASSWORD_DIGITS = '23456789'

/** 生成 12 位随机密码，保证同时包含字母与数字 */
function generatePassword(length = 12): string {
    const chars: string[] = [PASSWORD_LETTERS[randomInt(PASSWORD_LETTERS.length)], PASSWORD_DIGITS[randomInt(PASSWORD_DIGITS.length)]]
    while (chars.length < length) {
        chars.push(PASSWORD_CHARSET[randomInt(PASSWORD_CHARSET.length)])
    }
    // Fisher-Yates 洗牌，避免前两位固定为字母/数字
    for (let i = chars.length - 1; i > 0; i--) {
        const j = randomInt(i + 1)
        ;[chars[i], chars[j]] = [chars[j], chars[i]]
    }
    return chars.join('')
}

/** 重置用户密码（高危） */
export async function resetUserPassword(
    admin: AdminIdentity,
    userId: number,
    reason: string,
    ip: string
): Promise<{ username: string; newPassword: string }> {
    const user = await queryOne<{ id: number }>(`SELECT id FROM user WHERE id = ?`, [userId])
    if (!user) throw new BizError('用户不存在')

    const account = await queryOne<{ id: number; username: string }>(
        `SELECT id, username FROM account WHERE user_id = ? ORDER BY id ASC LIMIT 1`,
        [userId]
    )
    if (!account) throw new BizError('该用户没有可重置的账号')

    const newPassword = generatePassword()
    const passwordHash = hashPassword(newPassword)

    await withTransaction(async conn => {
        await conn.query(
            `UPDATE account SET password_hash = ?, updated_at = NOW() WHERE id = ?`,
            [passwordHash, account.id]
        )
        await writeAudit(conn, {
            adminId: admin.id,
            adminName: admin.username,
            action: 'user.reset_password',
            targetType: 'user',
            targetId: userId,
            reason,
            ip,
            before: null,
            after: null
        })
    })

    // 明文仅在本次响应返回，不入库、不入日志
    return { username: account.username, newPassword }
}
