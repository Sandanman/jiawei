/**
 * 管理端审计日志查询（F8）
 * 只读：仅提供列表与详情
 */
import { query, queryOne } from '../../db'
import { BizError } from '../../utils/bizError'
import { toNumber } from '../../controllers/admin/_common'
import { formatDateTime } from '../../utils/format'
import type { AdminAuditLogRow } from '../../types/admin'

interface ListOptions {
    adminId?: string
    action?: string
    targetType?: string
    targetId?: string
    familyId?: string
    from?: string
    to?: string
    page: number
    pageSize: number
    offset: number
}

function parseJson(value: any): any {
    if (value === null || value === undefined) return null
    if (typeof value === 'string') {
        try {
            return JSON.parse(value)
        } catch {
            return value
        }
    }
    return value
}

function mapLogRow(row: AdminAuditLogRow): any {
    return {
        id: row.id,
        adminId: row.admin_id,
        adminName: row.admin_name || '',
        action: row.action,
        targetType: row.target_type,
        targetId: row.target_id,
        familyId: row.family_id ?? null,
        reason: row.reason || '',
        ip: row.ip || '',
        createdAt: formatDateTime(row.created_at)
    }
}

/** 审计日志列表与筛选 */
export async function listAuditLogs(opts: ListOptions): Promise<{
    list: any[]
    total: number
    page: number
    pageSize: number
}> {
    const conditions: string[] = []
    const params: any[] = []

    const adminId = Number(opts.adminId)
    if (Number.isFinite(adminId) && adminId > 0) {
        conditions.push('admin_id = ?')
        params.push(adminId)
    }

    const action = (opts.action || '').trim()
    if (action) {
        conditions.push('action = ?')
        params.push(action)
    }

    const targetType = (opts.targetType || '').trim()
    if (targetType) {
        conditions.push('target_type = ?')
        params.push(targetType)
    }

    const targetId = (opts.targetId || '').trim()
    if (targetId) {
        conditions.push('target_id = ?')
        params.push(targetId)
    }

    const familyId = Number(opts.familyId)
    if (Number.isFinite(familyId) && familyId > 0) {
        conditions.push('family_id = ?')
        params.push(familyId)
    }

    if (opts.from) {
        conditions.push('created_at >= ?')
        params.push(`${opts.from} 00:00:00`)
    }
    if (opts.to) {
        conditions.push('created_at <= ?')
        params.push(`${opts.to} 23:59:59`)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const countRow = await queryOne<{ total: number }>(
        `SELECT COUNT(*) AS total FROM admin_audit_log ${where}`,
        params
    )

    const rows = await query<AdminAuditLogRow[]>(
        `SELECT id, admin_id, admin_name, action, target_type, target_id, family_id, reason, ip, created_at
         FROM admin_audit_log
         ${where}
         ORDER BY created_at DESC, id DESC
         LIMIT ? OFFSET ?`,
        [...params, opts.pageSize, opts.offset]
    )

    return {
        list: rows.map(mapLogRow),
        total: toNumber(countRow?.total),
        page: opts.page,
        pageSize: opts.pageSize
    }
}

/** 审计日志详情（含变更前后值） */
export async function getAuditLogDetail(logId: number): Promise<any> {
    const row = await queryOne<AdminAuditLogRow>(
        `SELECT * FROM admin_audit_log WHERE id = ?`,
        [logId]
    )
    if (!row) throw new BizError('审计日志不存在')

    return {
        ...mapLogRow(row),
        beforeData: parseJson(row.before_data),
        afterData: parseJson(row.after_data)
    }
}
