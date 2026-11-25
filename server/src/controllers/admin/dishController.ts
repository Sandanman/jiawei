/**
 * 管理端菜品控制器（F3）
 */
import type { Request, Response } from 'express'
import { asyncHandler } from '../../utils/asyncHandler'
import { BizError } from '../../utils/bizError'
import {
    listDishes,
    getDishDetail,
    updateDish,
    publishDish,
    deleteDish
} from '../../services/admin/dishService'
import { parsePage, parseId, requireReason, clientIp } from './_common'

/**
 * GET /api/admin/dishes
 * Query: { familyId?, keyword?, category?, isPublished?, soldOut?, page?, pageSize? }
 */
export const listHandler = asyncHandler(async (req: Request, res: Response) => {
    const { familyId, keyword, category, isPublished, soldOut } = req.query
    const result = await listDishes({
        familyId: familyId ? String(familyId) : '',
        keyword: keyword ? String(keyword) : '',
        category: category ? String(category) : '',
        isPublished: isPublished ? String(isPublished) : '',
        soldOut: soldOut ? String(soldOut) : '',
        ...parsePage(req.query)
    })
    res.success(result)
})

/**
 * GET /api/admin/dishes/:id
 */
export const detailHandler = asyncHandler(async (req: Request, res: Response) => {
    const detail = await getDishDetail(parseId(req.params.id, '菜品不存在'))
    res.success(detail)
})

/**
 * PUT /api/admin/dishes/:id
 * Body: { name?, description?, price?, points?, category?, imageUrl?, stock?, sortOrder? }
 */
export const updateHandler = asyncHandler(async (req: Request, res: Response) => {
    await updateDish(req.admin!, parseId(req.params.id, '菜品不存在'), req.body, clientIp(req))
    res.success(null, '已保存')
})

/**
 * PATCH /api/admin/dishes/:id/publish
 * Body: { isPublished: boolean }
 */
export const publishHandler = asyncHandler(async (req: Request, res: Response) => {
    const value = req.body?.isPublished
    if (value !== true && value !== false) {
        throw new BizError('isPublished 参数不合法')
    }
    await publishDish(req.admin!, parseId(req.params.id, '菜品不存在'), value, clientIp(req))
    res.success(null, value ? '已上架' : '已下架')
})

/**
 * POST /api/admin/dishes/:id/delete
 * Body: { reason }
 */
export const deleteHandler = asyncHandler(async (req: Request, res: Response) => {
    const reason = requireReason(req.body)
    await deleteDish(req.admin!, parseId(req.params.id, '菜品不存在'), reason, clientIp(req))
    res.success(null, '菜品已删除')
})
