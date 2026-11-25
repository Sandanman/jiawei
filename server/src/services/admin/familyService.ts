/**
 * 管理端家庭服务（F2）
 */
import type { PoolConnection } from 'mysql2/promise'
import { query, queryOne, withTransaction } from '../../db'
import { BizError } from '../../utils/bizError'
import { writeAudit } from './auditService'
import { escapeLike, maskPhone, toNumber } from '../../controllers/admin/_common'
import { formatDateTime } from '../../utils/format'
import type { AdminIdentity } from '../../types/admin'

interface ListOptions {
    keyword?: string
    status?: string
    page: number
    pageSize: number
    offset: number
}

interface FamilyQueryRow {
    id: number
    family_code: string
    family_name: string
    owner_id: number
    status: number
    created_at: string | Date
    owner_nickname: string | null
    owner_phone: string | null
    member_count: number
    dish_count: number
    order_count: number
}

/** 家庭列表与搜索 */
export async function listFamilies(opts: ListOptions): Promise<{
    list: any[]
    total: number
    page: number
    pageSize: number
}> {
    const conditions: string[] = []
    const params: any[] = []

    if (opts.status === '0' || opts.status === '1') {
        conditions.push('f.status = ?')
        params.push(Number(opts.status))
    }

    const keyword = (opts.keyword || '').trim()
    if (keyword) {
        const like = `%${escapeLike(keyword)}%`
        conditions.push(
            `(f.family_name LIKE ? OR f.family_code LIKE ? OR u.nickname LIKE ? OR u.phone LIKE ?)`
        )
        params.push(like, like, like, like)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const countRow = await queryOne<{ total: number }>(
        `SELECT COUNT(*) AS total
         FROM family f
         LEFT JOIN user u ON u.id = f.owner_id
         ${where}`,
        params
    )

    const rows = await query<FamilyQueryRow[]>(
        `SELECT f.id, f.family_code, f.family_name, f.owner_id, f.status, f.created_at,
                u.nickname AS owner_nickname, u.phone AS owner_phone,
                (SELECT COUNT(*) FROM family_member fm WHERE fm.family_id = f.id) AS member_count,
                (SELECT COUNT(*) FROM dish d WHERE d.family_id = f.id) AS dish_count,
                (SELECT COUNT(*) FROM \`order\` o WHERE o.family_id = f.id) AS order_count
         FROM family f
         LEFT JOIN user u ON u.id = f.owner_id
         ${where}
         ORDER BY f.created_at DESC, f.id DESC
         LIMIT ? OFFSET ?`,
        [...params, opts.pageSize, opts.offset]
    )

    return {
        list: rows.map(row => ({
            id: row.id,
            familyCode: row.family_code,
            familyName: row.family_name,
            ownerId: row.owner_id,
            ownerNickname: row.owner_nickname || '',
            ownerPhone: maskPhone(row.owner_phone),
            status: row.status,
            memberCount: toNumber(row.member_count),
            dishCount: toNumber(row.dish_count),
            orderCount: toNumber(row.order_count),
            createdAt: formatDateTime(row.created_at)
        })),
        total: toNumber(countRow?.total),
        page: opts.page,
        pageSize: opts.pageSize
    }
}

/** 家庭详情 */
export async function getFamilyDetail(familyId: number): Promise<any> {
    const family = await queryOne<{
        id: number
        family_code: string
        family_name: string
        description: string
        owner_id: number
        status: number
        created_at: string | Date
        updated_at: string | Date
    }>(
        `SELECT id, family_code, family_name, description, owner_id, status, created_at, updated_at
         FROM family WHERE id = ?`,
        [familyId]
    )
    if (!family) throw new BizError('家庭不存在')

    const members = await query<Array<{
        user_id: number
        nickname: string
        phone: string
        role: string
        points: number
        admin_remark: string
        joined_at: string | Date
    }>>(
        `SELECT fm.user_id, u.nickname, u.phone, fm.role, fm.points, fm.admin_remark, fm.joined_at
         FROM family_member fm
         INNER JOIN user u ON u.id = fm.user_id
         WHERE fm.family_id = ?
         ORDER BY FIELD(fm.role, 'owner', 'admin', 'member'), fm.joined_at ASC`,
        [familyId]
    )

    const [dishCount, orderCount, taskCount, rewardCount] = await Promise.all([
        countOf('dish', familyId),
        countOf('`order`', familyId),
        countOf('task', familyId),
        countOf('reward', familyId)
    ])

    return {
        id: family.id,
        familyCode: family.family_code,
        familyName: family.family_name,
        description: family.description || '',
        ownerId: family.owner_id,
        status: family.status,
        createdAt: formatDateTime(family.created_at),
        updatedAt: formatDateTime(family.updated_at),
        members: members.map(m => ({
            userId: m.user_id,
            nickname: m.nickname,
            phone: m.phone,
            role: m.role,
            points: toNumber(m.points),
            adminRemark: m.admin_remark || '',
            joinedAt: formatDateTime(m.joined_at)
        })),
        stats: {
            dishCount,
            orderCount,
            taskCount,
            rewardCount
        }
    }
}

/** 安全统计指定表在某家庭下的行数（表名由内部常量传入，不来自用户输入） */
async function countOf(table: string, familyId: number): Promise<number> {
    const row = await queryOne<{ total: number }>(
        `SELECT COUNT(*) AS total FROM ${table} WHERE family_id = ?`,
        [familyId]
    )
    return toNumber(row?.total)
}

/** 编辑家庭名称与描述 */
export async function updateFamily(
    admin: AdminIdentity,
    familyId: number,
    body: any,
    ip: string
): Promise<void> {
    const hasName = body?.familyName !== undefined
    const hasDesc = body?.description !== undefined
    if (!hasName && !hasDesc) {
        throw new BizError('没有可更新的内容')
    }

    let familyName: string | undefined
    if (hasName) {
        familyName = String(body.familyName ?? '').trim()
        if (familyName.length < 1 || familyName.length > 64) {
            throw new BizError('家庭名称需为 1-64 个字符')
        }
    }

    let description: string | undefined
    if (hasDesc) {
        description = String(body.description ?? '')
        if (description.length > 255) {
            throw new BizError('描述不能超过 255 个字符')
        }
    }

    const family = await queryOne<{ id: number; family_name: string; description: string }>(
        `SELECT id, family_name, description FROM family WHERE id = ?`,
        [familyId]
    )
    if (!family) throw new BizError('家庭不存在')

    const before: Record<string, any> = {}
    const after: Record<string, any> = {}
    const sets: string[] = []
    const params: any[] = []

    if (familyName !== undefined && familyName !== family.family_name) {
        before.familyName = family.family_name
        after.familyName = familyName
        sets.push('family_name = ?')
        params.push(familyName)
    }
    if (description !== undefined && description !== family.description) {
        before.description = family.description || ''
        after.description = description
        sets.push('description = ?')
        params.push(description)
    }

    if (sets.length === 0) {
        throw new BizError('没有可更新的内容')
    }

    await withTransaction(async conn => {
        await conn.query(
            `UPDATE family SET ${sets.join(', ')}, updated_at = NOW() WHERE id = ?`,
            [...params, familyId]
        )
        await writeAudit(conn, {
            adminId: admin.id,
            adminName: admin.username,
            action: 'family.update',
            targetType: 'family',
            targetId: familyId,
            familyId,
            ip,
            before,
            after
        })
    })
}

/** 注销前影响范围 */
export async function getCloseImpact(familyId: number): Promise<{
    memberCount: number
    openOrderCount: number
    openTaskCount: number
    pendingRewardOrderCount: number
}> {
    const family = await queryOne<{ id: number }>(`SELECT id FROM family WHERE id = ?`, [familyId])
    if (!family) throw new BizError('家庭不存在')

    const [memberCount, openOrderCount, openTaskCount, pendingRewardOrderCount] = await Promise.all([
        queryCount(`SELECT COUNT(*) AS total FROM family_member WHERE family_id = ?`, [familyId]),
        queryCount(
            `SELECT COUNT(*) AS total FROM \`order\` WHERE family_id = ? AND status IN ('pending','confirmed')`,
            [familyId]
        ),
        queryCount(
            `SELECT COUNT(*) AS total FROM task WHERE family_id = ? AND status IN ('published','paused')`,
            [familyId]
        ),
        queryCount(
            `SELECT COUNT(*) AS total FROM reward_order WHERE family_id = ? AND status = 'pending'`,
            [familyId]
        )
    ])

    return { memberCount, openOrderCount, openTaskCount, pendingRewardOrderCount }
}

async function queryCount(sql: string, params: any[]): Promise<number> {
    const row = await queryOne<{ total: number }>(sql, params)
    return toNumber(row?.total)
}

export type FamilyStatusAction = 'close' | 'restore'

/** 注销 / 恢复家庭（高危） */
export async function setFamilyStatus(
    admin: AdminIdentity,
    familyId: number,
    action: FamilyStatusAction,
    reason: string,
    ip: string
): Promise<void> {
    const targetStatus = action === 'close' ? 0 : 1
    const fromStatus = action === 'close' ? 1 : 0
    const conflictMessage = action === 'close' ? '家庭已注销' : '家庭未注销'

    const family = await queryOne<{ id: number; status: number }>(
        `SELECT id, status FROM family WHERE id = ?`,
        [familyId]
    )
    if (!family) throw new BizError('家庭不存在')
    if (family.status !== fromStatus) throw new BizError(conflictMessage)

    await withTransaction(async conn => {
        const affected = await conditionalUpdate(conn, familyId, targetStatus, fromStatus)
        if (affected === 0) throw new BizError(conflictMessage)

        await writeAudit(conn, {
            adminId: admin.id,
            adminName: admin.username,
            action: action === 'close' ? 'family.close' : 'family.restore',
            targetType: 'family',
            targetId: familyId,
            familyId,
            reason,
            ip,
            before: { status: fromStatus },
            after: { status: targetStatus }
        })
    })
}

async function conditionalUpdate(
    conn: PoolConnection,
    familyId: number,
    targetStatus: number,
    fromStatus: number
): Promise<number> {
    const [result] = await conn.query(
        `UPDATE family SET status = ?, updated_at = NOW() WHERE id = ? AND status = ?`,
        [targetStatus, familyId, fromStatus]
    )
    return (result as any).affectedRows as number
}
