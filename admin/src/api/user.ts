import { get, post } from './http'
import type {
    DisableUserResult,
    PagedResult,
    ResetPasswordResult,
    UserDetail,
    UserListItem
} from './types'

export interface UserListQuery {
    keyword?: string
    status?: number
    createdFrom?: string
    createdTo?: string
    page: number
    pageSize: number
}

/** 用户列表 */
export function listUsers(query: UserListQuery): Promise<PagedResult<UserListItem>> {
    return get<PagedResult<UserListItem>>('/users', query)
}

/** 用户详情 */
export function getUser(id: number): Promise<UserDetail> {
    return get<UserDetail>(`/users/${id}`)
}

/** 禁用用户（返回其担任房主的家庭） */
export function disableUser(id: number, reason: string): Promise<DisableUserResult> {
    return post<DisableUserResult>(`/users/${id}/disable`, { reason })
}

/** 启用用户 */
export function enableUser(id: number, reason: string): Promise<null> {
    return post<null>(`/users/${id}/enable`, { reason })
}

/** 重置用户密码（明文仅在本次响应返回） */
export function resetUserPassword(id: number, reason: string): Promise<ResetPasswordResult> {
    return post<ResetPasswordResult>(`/users/${id}/reset-password`, { reason })
}
