/**
 * 管理端兑换记录服务（F5）
 */
import { query, queryOne, withTransaction } from '../../db'
import { BizError } from '../../utils/bizError'
import { writeAudit } from './auditService'
import { toNumber } from '../../controllers/admin/_common'
import { formatDateTime } from '../../utils/format'
import { cancelRewardOrderCore } from '../rewardService'
import type { AdminIdentity } from '../../types/admin'
import type { RewardOrderRow } from '../../types/db'

interface ListOptions {
    familyId?: string
    userId?: string
    status?: string
    category?: string
    createdFrom?: string
    createdTo?: string
    page: number
    pageSize: number
    offset: number
}

interface RewardOrderQueryRow {
    id: number
    reward_id: number
    reward_name: string
    reward_image: string
    reward_points: number
    category: string
    family_id: number
    family_name: string | null
    user_id: number
    nickname: string | null
    remark: string
    status: string
    received_at: string | Date | null
    received_by: number | null
    created_at: string | Date
}

function mapRewardOrderRow(row: RewardOrderQueryRow): any {
    return {
        id: row.id,
        rewardId: row.reward_id,
        rewardName: row.reward_name,
        rewardImage: row.reward_image || '',
        rewardPoints: toNumber(row.reward_points),
        category: row.category,
        familyId: row.family_id,
        familyName: row.family_name || '',
        userId: row.user_id,
        nickname: row.nickname || '',
        remark: row.remark || '',
        status: row.status,
        receivedAt: formatDateTime(row.received_at),
        receivedBy: row.received_by ?? null,
        createdAt: formatDateTime(row.created_at)
    }
}

const REWARD_STATUS = ['pending', 'received', 'cancelled']
const REWARD_CATEGORIES = ['physical', 'gift', 'play', 'dish']

/** 兑换记录列表与搜索（跨家庭） */
export async function listRewardOrders(opts: ListOptions): Promise<{
    list: any[]
    total: number
    page: number
    pageSize: number
}> {
    const conditions: string[] = []
    const params: any[] = []

    const familyId = Number(opts.familyId)
    if (Number.isFinite(familyId) && familyId > 0) {
        conditions.push('o.family_id = ?')
        params.push(familyId)
    }

    const userId = Number(opts.userId)
    if (Number.isFinite(userId) && userId > 0) {
        conditions.push('o.user_id = ?')
        params.push(userId)
    }

    if (opts.status && REWARD_STATUS.includes(opts.status)) {
        conditions.push('o.status = ?')
        params.push(opts.status)
    }

    if (opts.category && REWARD_CATEGORIES.includes(opts.category)) {
        conditions.push('o.category = ?')
        params.push(opts.category)
    }

    if (opts.createdFrom) {
        conditions.push('o.created_at >= ?')
        params.push(`${opts.createdFrom} 00:00:00`)
    }
    if (opts.createdTo) {
        conditions.push('o.created_at <= ?')
        params.push(`${opts.createdTo} 23:59:59`)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const countRow = await queryOne<{ total: number }>(
        `SELECT COUNT(*) AS total FROM reward_order o ${where}`,
        params
    )

    const rows = await query<RewardOrderQueryRow[]>(
        `SELECT o.*, f.family_name, u.nickname
         FROM reward_order o
         LEFT JOIN family f ON f.id = o.family_id
         LEFT JOIN user u ON u.id = o.user_id
         ${where}
         ORDER BY o.created_at DESC, o.id DESC
         LIMIT ? OFFSET ?`,
        [...params, opts.pageSize, opts.offset]
    )

    return {
        list: rows.map(mapRewardOrderRow),
        total: toNumber(countRow?.total),
        page: opts.page,
        pageSize: opts.pageSize
    }
}

/** 兑换记录详情 */
export async function getRewardOrderDetail(orderId: number): Promise<any> {
    const row = await queryOne<RewardOrderQueryRow>(
        `SELECT o.*, f.family_name, u.nickname
         FROM reward_order o
         LEFT JOIN family f ON f.id = o.family_id
         LEFT JOIN user u ON u.id = o.user_id
         WHERE o.id = ?`,
        [orderId]
    )
    if (!row) throw new BizError('兑换记录不存在')
    return mapRewardOrderRow(row)
}

/** 撤销兑换（高危）：退积分 + 归还库存 + 审计，全部在同一事务 */
export async function cancelAdminRewardOrder(
    admin: AdminIdentity,
    orderId: number,
    reason: string,
    ip: string
): Promise<{ refundedPoints: number }> {
    const order = await queryOne<RewardOrderRow>(
        `SELECT * FROM reward_order WHERE id = ?`,
        [orderId]
    )
    if (!order) throw new BizError('兑换记录不存在')
    if (order.status !== 'pending') {
        throw new BizError('仅待领取状态的兑换可撤销')
    }

    return withTransaction(async conn => {
        const result = await cancelRewardOrderCore(conn, order, {
            descriptionPrefix: '[平台撤销] ',
            requireMemberForRefund: true,
            statusChangedMessage: '兑换状态变更失败，可能已被处理'
        })

        await writeAudit(conn, {
            adminId: admin.id,
            adminName: admin.username,
            action: 'reward_order.cancel',
            targetType: 'reward_order',
            targetId: orderId,
            familyId: order.family_id,
            reason,
            ip,
            before: { status: order.status },
            after: { status: 'cancelled' }
        })

        return { refundedPoints: result.refundedPoints }
    })
}
