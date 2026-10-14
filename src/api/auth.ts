/**
 * 鉴权 API
 */
import { http } from '@/utils/request'
import type { LoginResult, UserInfo, FamilyBrief, RegisterPayload, RegisterResult } from './types'

/** 账号密码登录 */
export function login(username: string, password: string) {
    return http.post<LoginResult>('/auth/login', { username, password })
}

/** 注册 */
export function register(payload: RegisterPayload) {
    return http.post<RegisterResult>('/auth/register', payload)
}

/** 重置密码（手机号 + 新密码） */
export function resetPassword(username: string, newPassword: string) {
    return http.post<null>('/auth/reset-password', { username, newPassword })
}

/** 获取当前用户信息 */
export function getProfile() {
    return http.get<{
        id: number
        nickname: string
        avatar: string
        phone: string
        points: number
        inviteCode: string
        families: FamilyBrief[]
    }>('/auth/profile')
}

/** 退出登录 */
export function logout() {
    return http.post<null>('/auth/logout')
}

export type { LoginResult, UserInfo }
