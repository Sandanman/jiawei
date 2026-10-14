/**
 * 订单 API
 */
import { http } from '@/utils/request'
import type { Order, OrderStatus, CreateOrderPayload, CreateOrderResult } from './types'

/** 订单列表 */
export function listOrders(
    familyId: number,
    options?: { status?: OrderStatus; mine?: boolean }
) {
    const params: Record<string, any> = { familyId }
    if (options?.status) params.status = options.status
    if (options?.mine) params.mine = '1'
    return http.get<Order[]>('/order', params)
}

/** 订单详情 */
export function getOrder(familyId: number, orderId: number) {
    return http.get<Order>(`/order/${orderId}`, { familyId })
}

/** 下单 */
export function createOrder(data: CreateOrderPayload) {
    return http.post<CreateOrderResult>('/order', data)
}

/** 确认订单 */
export function confirmOrder(familyId: number, orderId: number) {
    return http.patch<null>(`/order/${orderId}/confirm`, { familyId })
}

/** 完成订单 */
export function completeOrder(familyId: number, orderId: number) {
    return http.patch<null>(`/order/${orderId}/complete`, { familyId })
}

/** 取消订单 */
export function cancelOrder(familyId: number, orderId: number) {
    return http.patch<null>(`/order/${orderId}/cancel`, { familyId })
}
