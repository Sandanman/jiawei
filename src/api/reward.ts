/**
 * 积分商城 API
 */
import { http } from '@/utils/request'
import type {
    Reward,
    RewardCategory,
    RewardOrder,
    RewardOrderStatus,
    CreateRewardPayload,
    UpdateRewardPayload,
    RedeemRewardPayload,
    RedeemRewardResult
} from './types'

/** 奖励商品列表（普通用户默认只看上架；管理员传 includeUnpublished 看全部） */
export function listRewards(
    familyId: number,
    options?: { category?: RewardCategory; includeUnpublished?: boolean }
) {
    const params: Record<string, any> = { familyId }
    if (options?.category) params.category = options.category
    if (options?.includeUnpublished) params.includeUnpublished = '1'
    return http.get<Reward[]>('/reward', params)
}

/** 奖励详情 */
export function getReward(familyId: number, rewardId: number) {
    return http.get<Reward>(`/reward/${rewardId}`, { familyId })
}

/** 创建奖励（管理员） */
export function createReward(data: CreateRewardPayload) {
    return http.post<{ id: number }>('/reward', data)
}

/** 更新奖励（管理员） */
export function updateReward(rewardId: number, data: UpdateRewardPayload & { familyId: number }) {
    return http.put<null>(`/reward/${rewardId}`, data)
}

/** 删除奖励（管理员） */
export function deleteReward(familyId: number, rewardId: number) {
    return http.delete<null>(`/reward/${rewardId}`, { familyId })
}

/** 上架/下架奖励（管理员） */
export function toggleRewardPublish(rewardId: number, familyId: number, isPublished: boolean) {
    return http.patch<null>(`/reward/${rewardId}/publish`, { familyId, isPublished })
}

/** 兑换奖励（扣积分） */
export function redeemReward(data: RedeemRewardPayload) {
    return http.post<RedeemRewardResult>('/reward/redeem', data)
}

/** 兑换记录列表（不传 userId 查全部，传则查本人） */
export function listRewardOrders(
    familyId: number,
    options?: { userId?: number; status?: RewardOrderStatus; mine?: boolean }
) {
    const params: Record<string, any> = { familyId }
    if (options?.userId) params.userId = options.userId
    if (options?.status) params.status = options.status
    if (options?.mine) params.mine = '1'
    return http.get<RewardOrder[]>('/reward/orders', params)
}

/** 确认已领取（管理员） */
export function markRewardReceived(familyId: number, orderId: number) {
    return http.patch<null>(`/reward/orders/${orderId}/received`, { familyId })
}

/** 撤销兑换（本人待领取状态，积分退回） */
export function cancelRewardOrder(familyId: number, orderId: number) {
    return http.patch<null>(`/reward/orders/${orderId}/cancel`, { familyId })
}
