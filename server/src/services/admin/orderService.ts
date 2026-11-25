/**
 * 管理端订单服务（F5）
 */
import { query, queryOne, withTransaction } from '../../db'
import { BizError } from '../../utils/bizError'
import { writeAudit } from './auditService'
import { toNumber } from '../../controllers/admin/_common'
import { formatDateTime } from '../../utils/format'
import { cancelOrderCore } from '../orderService'
import type { AdminIdentity } from '../../types/admin'
import type { OrderRow, OrderItemRow, PointsRecordRow } from '../../types/db'

interface ListOptions {
    familyId?: string
    userId?: string
    orderNo?: string
    status?: string
    createdFrom?: string
    createdTo?: string
    page: number
    pageSize: number
    offset: number
}

interface OrderQueryRow {
    id: number
    order_no: string
    family_id: number
    family_name: string | null
    user_id: number
    nickname: string | null
    total_amount: string
    total_points: number
    status: string
    remark: string
    created_at: string | Date
}

function mapOrderRow(row: OrderQueryRow): any {
    return {
        id: row.id,
        orderNo: row.order_no,
        familyId: row.family_id,
        familyName: row.family_name || '',
        userId: row.user_id,
        nickname: row.nickname || '',
        totalAmount: Number(row.total_amount),
        totalPoints: toNumber(row.total_points),
        status: row.status,
        remark: row.remark || '',
        createdAt: formatDateTime(row.created_at)
    }
}

const ORDER_STATUS = ['pending', 'confirmed', 'completed', 'cancelled']

/** 订单列表与搜索（跨家庭） */
export async function listOrders(opts: ListOptions): Promise<{
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

    const orderNo = (opts.orderNo || '').trim()
    if (orderNo) {
        conditions.push('o.order_no = ?')
        params.push(orderNo)
    }

    if (opts.status && ORDER_STATUS.includes(opts.status)) {
        conditions.push('o.status = ?')
        params.push(opts.status)
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
        `SELECT COUNT(*) AS total FROM \`order\` o ${where}`,
        params
    )

    const rows = await query<OrderQueryRow[]>(
        `SELECT o.id, o.order_no, o.family_id, o.user_id, o.total_amount, o.total_points,
                o.status, o.remark, o.created_at,
                f.family_name, u.nickname
         FROM \`order\` o
         LEFT JOIN family f ON f.id = o.family_id
         LEFT JOIN user u ON u.id = o.user_id
         ${where}
         ORDER BY o.created_at DESC, o.id DESC
         LIMIT ? OFFSET ?`,
        [...params, opts.pageSize, opts.offset]
    )

    return {
        list: rows.map(mapOrderRow),
        total: toNumber(countRow?.total),
        page: opts.page,
        pageSize: opts.pageSize
    }
}

/** 订单详情（含明细与关联积分流水） */
export async function getOrderDetail(orderId: number): Promise<any> {
    const row = await queryOne<OrderQueryRow>(
        `SELECT o.id, o.order_no, o.family_id, o.user_id, o.total_amount, o.total_points,
                o.status, o.remark, o.created_at,
                f.family_name, u.nickname
         FROM \`order\` o
         LEFT JOIN family f ON f.id = o.family_id
         LEFT JOIN user u ON u.id = o.user_id
         WHERE o.id = ?`,
        [orderId]
    )
    if (!row) throw new BizError('订单不存在')

    const items = await query<OrderItemRow[]>(
        `SELECT * FROM order_item WHERE order_id = ? ORDER BY id ASC`,
        [orderId]
    )

    const pointsRows = await query<PointsRecordRow[]>(
        `SELECT * FROM points_record
         WHERE reference_type = 'order' AND reference_id = ?
         ORDER BY created_at ASC, id ASC`,
        [orderId]
    )

    return {
        ...mapOrderRow(row),
        items: items.map(item => ({
            dishId: item.dish_id,
            dishName: item.dish_name,
            dishImageUrl: item.dish_image_url || '',
            price: Number(item.price),
            points: toNumber(item.points),
            quantity: toNumber(item.quantity),
            subtotal: Number(item.subtotal)
        })),
        pointsRecords: pointsRows.map(record => ({
            id: record.id,
            pointsChange: record.points_change,
            pointsBalance: record.points_balance,
            type: record.type,
            description: record.description || '',
            createdAt: formatDateTime(record.created_at)
        }))
    }
}

/** 强制取消订单（高危）：归还库存 + 退积分 + 审计，全部在同一事务 */
export async function cancelAdminOrder(
    admin: AdminIdentity,
    orderId: number,
    reason: string,
    ip: string
): Promise<{ refundedPoints: number }> {
    const order = await queryOne<OrderRow>(
        `SELECT * FROM \`order\` WHERE id = ?`,
        [orderId]
    )
    if (!order) throw new BizError('订单不存在')
    if (!['pending', 'confirmed'].includes(order.status)) {
        throw new BizError('订单状态不允许取消')
    }

    const items = await query<OrderItemRow[]>(
        `SELECT * FROM order_item WHERE order_id = ?`,
        [orderId]
    )

    return withTransaction(async conn => {
        let result: Awaited<ReturnType<typeof cancelOrderCore>>
        try {
            result = await cancelOrderCore(conn, order, items, {
                descriptionPrefix: '[平台取消] ',
                requireMemberForRefund: true,
                statusChangedMessage: '订单状态已变更'
            })
        } catch (err) {
            throw err instanceof BizError ? err : new BizError((err as Error).message)
        }

        await writeAudit(conn, {
            adminId: admin.id,
            adminName: admin.username,
            action: 'order.cancel',
            targetType: 'order',
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
