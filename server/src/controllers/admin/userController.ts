/**
 * 管理端用户与账号控制器（F4）
 */
import type { Request, Response } from 'express'
import { asyncHandler } from '../../utils/asyncHandler'
import {
    listUsers,
    getUserDetail,
    setUserStatus,
    resetUserPassword
} from '../../services/admin/userService'
import { parsePage, parseId, requireReason, clientIp } from './_common'

/**
 * GET /api/admin/users
 * Query: { keyword?, status?, createdFrom?, createdTo?, page?, pageSize? }
 */
export const listHandler = asyncHandler(async (req: Request, res: Response) => {
    const { keyword, status, createdFrom, createdTo } = req.query
    const result = await listUsers({
        keyword: keyword ? String(keyword) : '',
        status: status ? String(status) : '',
        createdFrom: createdFrom ? String(createdFrom) : '',
        createdTo: createdTo ? String(createdTo) : '',
        ...parsePage(req.query)
    })
    res.success(result)
})

/**
 * GET /api/admin/users/:id
 */
export const detailHandler = asyncHandler(async (req: Request, res: Response) => {
    const detail = await getUserDetail(parseId(req.params.id, '用户不存在'))
    res.success(detail)
})

/**
 * POST /api/admin/users/:id/disable
 * Body: { reason }
 */
export const disableHandler = asyncHandler(async (req: Request, res: Response) => {
    const reason = requireReason(req.body)
    const result = await setUserStatus(
        req.admin!,
        parseId(req.params.id, '用户不存在'),
        'disable',
        reason,
        clientIp(req)
    )
    res.success(result, '用户已禁用')
})

/**
 * POST /api/admin/users/:id/enable
 * Body: { reason }
 */
export const enableHandler = asyncHandler(async (req: Request, res: Response) => {
    const reason = requireReason(req.body)
    await setUserStatus(
        req.admin!,
        parseId(req.params.id, '用户不存在'),
        'enable',
        reason,
        clientIp(req)
    )
    res.success(null, '用户已启用')
})

/**
 * POST /api/admin/users/:id/reset-password
 * Body: { reason }
 */
export const resetPasswordHandler = asyncHandler(async (req: Request, res: Response) => {
    const reason = requireReason(req.body)
    const result = await resetUserPassword(
        req.admin!,
        parseId(req.params.id, '用户不存在'),
        reason,
        clientIp(req)
    )
    res.success(result, '密码已重置')
})
