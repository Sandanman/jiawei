import { get } from './http'
import type { AuditLogDetail, AuditLogItem, PagedResult } from './types'

export interface AuditLogQuery {
    adminId?: number
    action?: string
    targetType?: string
    targetId?: string
    familyId?: number
    from?: string
    to?: string
    page: number
    pageSize: number
}

/** 审计日志列表 */
export function listAuditLogs(query: AuditLogQuery): Promise<PagedResult<AuditLogItem>> {
    return get<PagedResult<AuditLogItem>>('/audit-logs', query)
}

/** 审计日志详情（含变更前后值） */
export function getAuditLog(id: number): Promise<AuditLogDetail> {
    return get<AuditLogDetail>(`/audit-logs/${id}`)
}
