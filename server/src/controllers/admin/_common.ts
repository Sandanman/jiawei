/**
 * 管理后台控制器公共工具
 */
import type { Request } from 'express'
import { BizError } from '../../utils/bizError'

export interface PageParams {
    page: number
    pageSize: number
    offset: number
}

/** 解析分页参数：page 默认 1，pageSize 默认 20、上限 100 */
export function parsePage(query: any, defaultSize = 20, maxSize = 100): PageParams {
    const rawPage = Number(query?.page)
    const rawSize = Number(query?.pageSize)

    const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1
    let pageSize = Number.isFinite(rawSize) && rawSize > 0 ? Math.floor(rawSize) : defaultSize
    if (pageSize > maxSize) pageSize = maxSize

    return { page, pageSize, offset: (page - 1) * pageSize }
}

/** 校验操作原因：去除首尾空格后 4-200 字，否则抛业务错误 */
export function requireReason(body: any): string {
    const reason = typeof body?.reason === 'string' ? body.reason.trim() : ''
    if (reason.length < 4 || reason.length > 200) {
        throw new BizError('请填写操作原因')
    }
    return reason
}

/** 转义 LIKE 通配符，避免用户输入的 % _ \ 影响匹配 */
export function escapeLike(keyword: string): string {
    return keyword.replace(/[\\%_]/g, ch => `\\${ch}`)
}

/** 手机号脱敏：保留前 3 后 4 */
export function maskPhone(phone: string | null | undefined): string {
    if (!phone) return ''
    const value = String(phone)
    if (value.length <= 7) return value.replace(/.(?=.{2})/g, '*')
    return `${value.slice(0, 3)}****${value.slice(-4)}`
}

/** 取客户端 IP（优先 X-Forwarded-For 首个） */
export function clientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for']
    const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded
    const ip = (raw ? String(raw).split(',')[0].trim() : '') || req.ip || ''
    return ip.replace(/^::ffff:/, '').slice(0, 45)
}

/** 解析路径参数 ID，非法时抛出指定文案的业务错误 */
export function parseId(raw: string | undefined, message = '参数不合法'): number {
    const id = Number(raw)
    if (!Number.isFinite(id) || id <= 0) throw new BizError(message)
    return Math.floor(id)
}

export { formatDateTime, toNumber } from '../../utils/format'
