/**
 * 管理端 JWT 签发与校验
 * 独立密钥（ADMIN_JWT_SECRET）+ aud='admin'，与业务端 token 互不通用
 */
import jwt from 'jsonwebtoken'
import { config } from '../config'
import type { AdminTokenPayload } from '../types/admin'

/** 签发管理端 token */
export function signAdminToken(payload: Pick<AdminTokenPayload, 'adminId' | 'username' | 'ver'>): string {
    return jwt.sign(
        { ...payload, aud: 'admin' },
        config.adminJwt.secret,
        { expiresIn: config.adminJwt.expiresIn as any }
    )
}

/** 校验管理端 token，强校验 audience='admin' */
export function verifyAdminToken(token: string): AdminTokenPayload | null {
    try {
        const decoded = jwt.verify(token, config.adminJwt.secret, { audience: 'admin' })
        if (typeof decoded === 'string') return null
        return decoded as AdminTokenPayload
    } catch {
        return null
    }
}

/** 从 Authorization 头提取并校验 token */
export function extractAdminToken(authHeader?: string): AdminTokenPayload | null {
    if (!authHeader) return null
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader
    return verifyAdminToken(token)
}
