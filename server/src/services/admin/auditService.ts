/**
 * 审计日志写入
 * 只增不改；必须在业务事务连接内写入，保证业务变更与审计同生共死
 */
import type { PoolConnection } from 'mysql2/promise'
import type { WriteAuditEntry } from '../../types/admin'

const SENSITIVE_KEYS = ['password', 'passwordhash', 'password_hash', 'token', 'authorization']

/** 递归剔除敏感键（大小写不敏感） */
function sanitize(value: any): any {
    if (value === null || value === undefined) return null
    if (Array.isArray(value)) return value.map(sanitize)
    if (typeof value !== 'object') return value

    const result: Record<string, any> = {}
    for (const [key, val] of Object.entries(value)) {
        if (SENSITIVE_KEYS.includes(key.toLowerCase())) continue
        result[key] = sanitize(val)
    }
    return result
}

/** JSON 序列化：无内容时存 NULL */
function toJson(value: any): string | null {
    if (value === null || value === undefined) return null
    return JSON.stringify(sanitize(value))
}

/**
 * 写一条审计日志，返回日志 ID
 */
export async function writeAudit(conn: PoolConnection, entry: WriteAuditEntry): Promise<number> {
    const [result] = await conn.query(
        `INSERT INTO admin_audit_log
            (admin_id, admin_name, action, target_type, target_id, family_id, reason, before_data, after_data, ip)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            entry.adminId,
            entry.adminName,
            entry.action,
            entry.targetType,
            String(entry.targetId),
            entry.familyId ?? null,
            (entry.reason || '').slice(0, 255),
            toJson(entry.before),
            toJson(entry.after),
            entry.ip || ''
        ]
    )
    return (result as any).insertId
}
