/**
 * 管理端审计日志控制器（F8）
 */
import type { Request, Response } from 'express'
import { asyncHandler } from '../../utils/asyncHandler'
import { listAuditLogs, getAuditLogDetail } from '../../services/admin/auditQueryService'
import { parsePage, parseId } from './_common'

/**
 * GET /api/admin/audit-logs
 * Query: { adminId?, action?, targetType?, targetId?, familyId?, from?, to?, page?, pageSize? }
 */
export const listHandler = asyncHandler(async (req: Request, res: Response) => {
    const { adminId, action, targetType, targetId, familyId, from, to } = req.query
    const result = await listAuditLogs({
        adminId: adminId ? String(adminId) : '',
        action: action ? String(action) : '',
        targetType: targetType ? String(targetType) : '',
        targetId: targetId ? String(targetId) : '',
        familyId: familyId ? String(familyId) : '',
        from: from ? String(from) : '',
        to: to ? String(to) : '',
        ...parsePage(req.query)
    })
    res.success(result)
})

/**
 * GET /api/admin/audit-logs/:id
 */
export const detailHandler = asyncHandler(async (req: Request, res: Response) => {
    const detail = await getAuditLogDetail(parseId(req.params.id, '审计日志不存在'))
    res.success(detail)
})
