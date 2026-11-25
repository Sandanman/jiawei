import { get, post } from './http'
import type { CancelResult, PagedResult, RewardOrderDetail, RewardOrderItem } from './types'

export interface RewardOrderListQuery {
    familyId?: number
    userId?: number
    status?: string
    category?: string
    createdFrom?: string
    createdTo?: string
    page: number
    pageSize: number
}

/** 兑换记录列表 */
export function listRewardOrders(
    query: RewardOrderListQuery
): Promise<PagedResult<RewardOrderItem>> {
    return get<PagedResult<RewardOrderItem>>('/reward-orders', query)
}

/** 兑换记录详情 */
export function getRewardOrder(id: number): Promise<RewardOrderDetail> {
    return get<RewardOrderDetail>(`/reward-orders/${id}`)
}

/** 撤销兑换 */
export function cancelRewardOrder(id: number, reason: string): Promise<CancelResult> {
    return post<CancelResult>(`/reward-orders/${id}/cancel`, { reason })
}
