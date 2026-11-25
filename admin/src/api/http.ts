/**
 * HTTP 请求层
 * - 统一注入 Authorization
 * - HTTP 200 + code!==0 视为业务失败，提示并抛 ApiError
 * - HTTP 401 或 code===401 清除 token 并跳登录
 */
import axios, { type AxiosResponse } from 'axios'
import { clearToken, getToken } from '../stores/token'
import { showError } from '../utils/message'

export interface ApiResponse<T> {
    code: number
    message: string
    data: T
}

export class ApiError extends Error {
    code: number
    data: any

    constructor(message: string, code = -1, data: any = null) {
        super(message)
        this.name = 'ApiError'
        this.code = code
        this.data = data
    }
}

const instance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE || '/api/admin',
    timeout: 15000
})

instance.interceptors.request.use(config => {
    const token = getToken()
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

function redirectToLogin(): void {
    clearToken()
    if (window.location.pathname !== '/login') {
        window.location.assign('/login')
    }
}

instance.interceptors.response.use(
    response => {
        const body = response.data as ApiResponse<any>
        if (body && body.code === 0) {
            return response
        }
        if (body && body.code === 401) {
            redirectToLogin()
            const err = new ApiError(body.message || '登录已过期，请重新登录', 401)
            showError(err.message)
            return Promise.reject(err)
        }
        const err = new ApiError(body?.message || '请求失败', body?.code ?? -1, body?.data ?? null)
        showError(err.message)
        return Promise.reject(err)
    },
    error => {
        if (error.response?.status === 401) {
            redirectToLogin()
            const message = error.response?.data?.message || '登录已过期，请重新登录'
            showError(message)
            return Promise.reject(new ApiError(message, 401))
        }
        const message = error.response?.data?.message || error.message || '网络异常，请稍后重试'
        showError(message)
        return Promise.reject(new ApiError(message, error.response?.status ?? -1))
    }
)

async function unwrap<T>(promise: Promise<AxiosResponse<ApiResponse<T>>>): Promise<T> {
    const response = await promise
    return response.data.data
}

export function get<T>(url: string, params?: Record<string, any>): Promise<T> {
    return unwrap<T>(instance.get(url, { params }))
}

export function post<T>(url: string, data?: any): Promise<T> {
    return unwrap<T>(instance.post(url, data))
}

export function put<T>(url: string, data?: any): Promise<T> {
    return unwrap<T>(instance.put(url, data))
}

export function patch<T>(url: string, data?: any): Promise<T> {
    return unwrap<T>(instance.patch(url, data))
}
