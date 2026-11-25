/**
 * 管理端家庭控制器（F2）
 */
import type { Request, Response } from 'express'
import { asyncHandler } from '../../utils/asyncHandler'
import {
    listFamilies,
    getFamilyDetail,
    updateFamily,
    getCloseImpact,
    setFamilyStatus
} from '../../services/admin/familyService'
import { parsePage, parseId, requireReason, clientIp } from './_common'

/**
 * GET /api/admin/families
 * Query: { keyword?, status?, page?, pageSize? }
 */
export const listHandler = asyncHandler(async (req: Request, res: Response) => {
    const { keyword, status } = req.query
    const result = await listFamilies({
        keyword: keyword ? String(keyword) : '',
        status: status ? String(status) : '',
        ...parsePage(req.query)
    })
    res.success(result)
})

/**
 * GET /api/admin/families/:id
 */
export const detailHandler = asyncHandler(async (req: Request, res: Response) => {
    const detail = await getFamilyDetail(parseId(req.params.id, '家庭不存在'))
    res.success(detail)
})

/**
 * PUT /api/admin/families/:id
 * Body: { familyName?, description? }
 */
export const updateHandler = asyncHandler(async (req: Request, res: Response) => {
    await updateFamily(req.admin!, parseId(req.params.id, '家庭不存在'), req.body, clientIp(req))
    res.success(null, '已保存')
})

/**
 * GET /api/admin/families/:id/close-impact
 */
export const closeImpactHandler = asyncHandler(async (req: Request, res: Response) => {
    const impact = await getCloseImpact(parseId(req.params.id, '家庭不存在'))
    res.success(impact)
})

/**
 * POST /api/admin/families/:id/close
 * Body: { reason }
 */
export const closeHandler = asyncHandler(async (req: Request, res: Response) => {
    const reason = requireReason(req.body)
    await setFamilyStatus(req.admin!, parseId(req.params.id, '家庭不存在'), 'close', reason, clientIp(req))
    res.success(null, '家庭已注销')
})

/**
 * POST /api/admin/families/:id/restore
 * Body: { reason }
 */
export const restoreHandler = asyncHandler(async (req: Request, res: Response) => {
    const reason = requireReason(req.body)
    await setFamilyStatus(req.admin!, parseId(req.params.id, '家庭不存在'), 'restore', reason, clientIp(req))
    res.success(null, '家庭已恢复')
})
