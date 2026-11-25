/**
 * 管理后台业务错误
 * 用于表达「可预期的业务错误」，由 adminError 中间件转成 HTTP 200 + code -1
 * 业务端（非 admin 路由）抛出的同类错误仍走全局 errorHandler（HTTP 500）
 */
export class BizError extends Error {
    data: any

    constructor(message: string, data: any = null) {
        super(message)
        this.name = 'BizError'
        this.data = data
    }
}
