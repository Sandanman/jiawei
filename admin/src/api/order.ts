import { get, post } from './http'
import type { CancelResult, OrderDetail, OrderListItem, PagedResult } from './types'

export interface OrderListQuery {
    familyId?: number
    userId?: number
    orderNo?: string
    status?: string
    createdFrom?: string
    createdTo?: string
    page: number
    pageSize: number
}

/** 订单列表 */
export function listOrders(query: OrderListQuery): Promise<PagedResult<OrderListItem>> {
    return get<PagedResult<OrderListItem>>('/orders', query)
}

/** 订单详情（含明细与积分流水） */
export function getOrder(id: number): Promise<OrderDetail> {
    return get<OrderDetail>(`/orders/${id}`)
}

/** 强制取消订单 */
export function cancelOrder(id: number, reason: string): Promise<CancelResult> {
    return post<CancelResult>(`/orders/${id}/cancel`, { reason })
}
