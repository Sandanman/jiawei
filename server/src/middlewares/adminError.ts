import type { Request, Response, NextFunction } from 'express'
import { BizError } from '../utils/bizError'

/**
 * 管理端错误处理
 * - BizError → HTTP 200 + { code: -1, message, data }
 * - 其他异常 → 交给全局 errorHandler
 * 必须挂在 admin 路由之后，全局 notFound / errorHandler 之前
 */
export function adminError(err: Error, _req: Request, res: Response, next: NextFunction): void {
    if (err instanceof BizError) {
        res.status(200).json({ code: -1, message: err.message, data: err.data ?? null })
        return
    }
    next(err)
}
