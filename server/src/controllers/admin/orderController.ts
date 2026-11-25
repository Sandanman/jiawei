/**
 * 管理端订单控制器（F5）
 */
import type { Request, Response } from 'express'
import { asyncHandler } from '../../utils/asyncHandler'
import { listOrders, getOrderDetail, cancelAdminOrder } from '../../services/admin/orderService'
import { parsePage, parseId, requireReason, clientIp } from './_common'

/**
 * GET /api/admin/orders
 * Query: { familyId?, userId?, orderNo?, status?, createdFrom?, createdTo?, page?, pageSize? }
 */
export const listHandler = asyncHandler(async (req: Request, res: Response) => {
    const { familyId, userId, orderNo, status, createdFrom, createdTo } = req.query
    const result = await listOrders({
        familyId: familyId ? String(familyId) : '',
        userId: userId ? String(userId) : '',
        orderNo: orderNo ? String(orderNo) : '',
        status: status ? String(status) : '',
        createdFrom: createdFrom ? String(createdFrom) : '',
        createdTo: createdTo ? String(createdTo) : '',
        ...parsePage(req.query)
    })
    res.success(result)
})

/**
 * GET /api/admin/orders/:id
 */
export const detailHandler = asyncHandler(async (req: Request, res: Response) => {
    const detail = await getOrderDetail(parseId(req.params.id, '订单不存在'))
    res.success(detail)
})

/**
 * POST /api/admin/orders/:id/cancel
 * Body: { reason }
 */
export const cancelHandler = asyncHandler(async (req: Request, res: Response) => {
    const reason = requireReason(req.body)
    const result = await cancelAdminOrder(
        req.admin!,
        parseId(req.params.id, '订单不存在'),
        reason,
        clientIp(req)
    )
    res.success(result, '订单已取消')
})
