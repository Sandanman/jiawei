import { get, patch, post, put } from './http'
import type { DishItem, DishUpdatePayload, PagedResult } from './types'

export interface DishListQuery {
    familyId?: number
    keyword?: string
    category?: string
    isPublished?: number
    soldOut?: number
    page: number
    pageSize: number
}

/** 菜品列表（跨家庭） */
export function listDishes(query: DishListQuery): Promise<PagedResult<DishItem>> {
    return get<PagedResult<DishItem>>('/dishes', query)
}

/** 菜品详情 */
export function getDish(id: number): Promise<DishItem> {
    return get<DishItem>(`/dishes/${id}`)
}

/** 编辑菜品 */
export function updateDish(id: number, payload: DishUpdatePayload): Promise<null> {
    return put<null>(`/dishes/${id}`, payload)
}

/** 上架 / 下架 */
export function publishDish(id: number, isPublished: boolean): Promise<null> {
    return patch<null>(`/dishes/${id}/publish`, { isPublished })
}

/** 删除菜品 */
export function deleteDish(id: number, reason: string): Promise<null> {
    return post<null>(`/dishes/${id}/delete`, { reason })
}
