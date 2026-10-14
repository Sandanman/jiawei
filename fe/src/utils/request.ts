/**
 * HTTP 请求封装（uni-app + TypeScript）
 * - 统一 baseURL / Authorization / Content-Type
 * - 统一处理后端响应码：code !== 0 抛错，401 跳登录
 * - 返回类型为 ApiResponse<T> 的 data 部分
 */
import { useUserStore } from '@/stores/user'

// 后端服务地址
// H5 开发：通过 vite proxy 或直连本地 3000；小程序：需配置合法域名或关闭校验
const BASE_URL = 'http://localhost:3000/api'

export interface ApiResponse<T = any> {
    code: number
    message: string
    data: T
}

export interface RequestOptions {
    url: string
    method?: UniApp.RequestOptions['method']
    data?: any
    params?: Record<string, any>
    /** 是否跳过 401 自动跳登录（默认 false） */
    skipAuthRedirect?: boolean
}

/**
 * 拼接 query string
 */
function buildQuery(params?: Record<string, any>): string {
    if (!params) return ''
    const sp = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
            sp.append(k, String(v))
        }
    })
    const s = sp.toString()
    return s ? `?${s}` : ''
}

/**
 * 统一请求函数
 */
export function request<T = any>(options: RequestOptions): Promise<T> {
    const { url, method = 'GET', data, params, skipAuthRedirect } = options

    const userStore = useUserStore()
    const token = userStore.token

    const fullUrl = `${BASE_URL}${url}${buildQuery(params)}`

    const header: Record<string, string> = {
        'Content-Type': 'application/json'
    }
    if (token) {
        header['Authorization'] = `Bearer ${token}`
    }

    return new Promise<T>((resolve, reject) => {
        uni.request({
            url: fullUrl,
            method,
            data,
            header,
            timeout: 15000,
            success: (res) => {
                const body = res.data as ApiResponse<T>

                // HTTP 层错误
                if (res.statusCode < 200 || res.statusCode >= 300) {
                    const msg = (body && body.message) || `请求失败 (${res.statusCode})`
                    uni.showToast({ title: msg, icon: 'none' })
                    return reject(new Error(msg))
                }

                // 业务层 401
                if (body.code === 401 && !skipAuthRedirect) {
                    userStore.logout()
                    uni.reLaunch({ url: '/pages/mock-login/index' })
                    return reject(new Error(body.message || '未登录'))
                }

                // 业务层错误
                if (body.code !== 0) {
                    uni.showToast({ title: body.message || '请求失败', icon: 'none' })
                    return reject(new Error(body.message || '请求失败'))
                }

                resolve(body.data)
            },
            fail: (err) => {
                const msg = err.errMsg || '网络错误'
                uni.showToast({ title: msg, icon: 'none' })
                reject(new Error(msg))
            }
        })
    })
}

/** 便捷方法（uni-app 在小程序端不支持 PATCH，需在 H5/微信H5 调试时使用） */
export const http = {
    get: <T = any>(url: string, params?: Record<string, any>) =>
        request<T>({ url, method: 'GET', params }),
    post: <T = any>(url: string, data?: any) =>
        request<T>({ url, method: 'POST', data }),
    put: <T = any>(url: string, data?: any) =>
        request<T>({ url, method: 'PUT', data }),
    patch: <T = any>(url: string, data?: any) =>
        request<T>({ url, method: 'PATCH' as any, data }),
    delete: <T = any>(url: string, params?: Record<string, any>) =>
        request<T>({ url, method: 'DELETE', params })
}
