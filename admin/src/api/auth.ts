import { get, post, put } from './http'
import type { AdminProfile, LoginResult } from './types'

/** 管理员登录 */
export function login(username: string, password: string): Promise<LoginResult> {
    return post<LoginResult>('/auth/login', { username, password })
}

/** 当前管理员信息 */
export function getMe(): Promise<AdminProfile> {
    return get<AdminProfile>('/auth/me')
}

/** 修改自己的密码（成功后 token_version 变更，需重新登录） */
export function changePassword(oldPassword: string, newPassword: string): Promise<null> {
    return put<null>('/auth/password', { oldPassword, newPassword })
}
