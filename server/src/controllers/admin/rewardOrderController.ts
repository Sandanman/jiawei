/**
 * 管理端兑换记录控制器（F5）
 */
import type { Request, Response } from 'express'
import { asyncHandler } from '../../utils/asyncHandler'
import {
    listRewardOrders,
    getRewardOrderDetail,
    cancelAdminRewardOrder
} from '../../services/admin/rewardOrderService'
import { parsePage, parseId, requireReason, clientIp } from './_common'

/**
 * GET /api/admin/reward-orders
 * Query: { familyId?, userId?, status?, category?, createdFrom?, createdTo?, page?, pageSize? }
 */
export const listHandler = asyncHandler(async (req: Request, res: Response) => {
    const { familyId, userId, status, category, createdFrom, createdTo } = req.query
    const result = await listRewardOrders({
        familyId: familyId ? String(familyId) : '',
        userId: userId ? String(userId) : '',
        status: status ? String(status) : '',
        category: category ? String(category) : '',
        createdFrom: createdFrom ? String(createdFrom) : '',
        createdTo: createdTo ? String(createdTo) : '',
        ...parsePage(req.query)
    })
    res.success(result)
})

/**
 * GET /api/admin/reward-orders/:id
 */
export const detailHandler = asyncHandler(async (req: Request, res: Response) => {
    const detail = await getRewardOrderDetail(parseId(req.params.id, '兑换记录不存在'))
    res.success(detail)
})

/**
 * POST /api/admin/reward-orders/:id/cancel
 * Body: { reason }
 */
export const cancelHandler = asyncHandler(async (req: Request, res: Response) => {
    const reason = requireReason(req.body)
    const result = await cancelAdminRewardOrder(
        req.admin!,
        parseId(req.params.id, '兑换记录不存在'),
        reason,
        clientIp(req)
    )
    res.success(result, '兑换已撤销')
})
