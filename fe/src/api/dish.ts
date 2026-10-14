/**
 * 菜品 API
 */
import { http } from '@/utils/request'
import type { Dish, CreateDishPayload, UpdateDishPayload } from './types'

/** 菜品列表 */
export function listDishes(
    familyId: number,
    options?: { category?: string; includeUnpublished?: boolean }
) {
    const params: Record<string, any> = { familyId }
    if (options?.category) params.category = options.category
    if (options?.includeUnpublished) params.includeUnpublished = '1'
    return http.get<Dish[]>('/dish', params)
}

/** 菜品详情 */
export function getDish(familyId: number, dishId: number) {
    return http.get<Dish>(`/dish/${dishId}`, { familyId })
}

/** 创建菜品 */
export function createDish(data: CreateDishPayload) {
    return http.post<{ id: number }>('/dish', data)
}

/** 更新菜品 */
export function updateDish(dishId: number, data: UpdateDishPayload & { familyId: number }) {
    return http.put<null>(`/dish/${dishId}`, data)
}

/** 删除菜品 */
export function deleteDish(familyId: number, dishId: number) {
    return http.delete<null>(`/dish/${dishId}`, { familyId })
}

/** 上架/下架 */
export function toggleDishPublish(dishId: number, familyId: number, isPublished: boolean) {
    return http.patch<null>(`/dish/${dishId}/publish`, { familyId, isPublished })
}
