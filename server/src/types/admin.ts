/**
 * 管理后台类型定义
 */

/** 管理员账号（admin_user） */
export interface AdminUserRow {
    id: number
    username: string
    password_hash: string
    nickname: string
    status: number
    token_version: number
    failed_count: number
    locked_until: string | null
    last_login_at: string | null
    created_at: string
    updated_at: string
}

/** 审计日志（admin_audit_log） */
export interface AdminAuditLogRow {
    id: number
    admin_id: number
    admin_name: string
    action: string
    target_type: string
    target_id: string
    family_id: number | null
    reason: string
    before_data: any
    after_data: any
    ip: string
    created_at: string
}

/** 管理端 JWT 载荷 */
export interface AdminTokenPayload {
    adminId: number
    username: string
    /** token_version 快照，改密后失效 */
    ver: number
    aud: 'admin'
}

/** 挂在 req 上的当前管理员信息 */
export interface AdminIdentity {
    id: number
    username: string
    nickname: string
}

/** 审计写入参数 */
export interface WriteAuditEntry {
    adminId: number
    adminName: string
    action: string
    targetType: string
    targetId: string | number
    familyId?: number | null
    reason?: string
    before?: any
    after?: any
    ip?: string
}
