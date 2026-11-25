import type { Request, Response, NextFunction } from 'express'
import { queryOne } from '../db'
import { extractAdminToken } from '../utils/adminJwt'
import type { AdminIdentity } from '../types/admin'

declare module 'express-serve-static-core' {
    interface Request {
        admin?: AdminIdentity
    }
}

/**
 * 管理端鉴权中间件
 * - 校验签名与 audience=admin
 * - 重新查询 admin_user：status=1 且 token_version 与 token 内 ver 一致
 * - 通过后挂载 req.admin
 * - 失败统一返回 HTTP 401 + code 401
 */
export async function adminAuthRequired(req: Request, res: Response, next: NextFunction): Promise<void> {
    const payload = extractAdminToken(req.headers.authorization)

    if (!payload) {
        res.status(401).json({ code: 401, message: '未登录或登录已过期', data: null })
        return
    }

    try {
        const admin = await queryOne<{
            id: number
            username: string
            nickname: string
            status: number
            token_version: number
        }>(
            `SELECT id, username, nickname, status, token_version FROM admin_user WHERE id = ?`,
            [payload.adminId]
        )

        if (!admin || admin.status !== 1 || admin.token_version !== payload.ver) {
            res.status(401).json({ code: 401, message: '登录状态已失效，请重新登录', data: null })
            return
        }

        req.admin = {
            id: admin.id,
            username: admin.username,
            nickname: admin.nickname
        }
        next()
    } catch (err) {
        next(err)
    }
}
