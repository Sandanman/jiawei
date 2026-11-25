const TOKEN_KEY = 'jiawei_admin_token'

/** 读取 token（未登录返回空串） */
export function getToken(): string {
    return localStorage.getItem(TOKEN_KEY) || ''
}

/** 保存 token */
export function setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token)
}

/** 清除 token */
export function clearToken(): void {
    localStorage.removeItem(TOKEN_KEY)
}
