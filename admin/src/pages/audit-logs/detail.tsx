import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Card, Descriptions, Spin } from 'antd'
import { JsonDiff, PageContainer } from '../../components'
import { getAuditLog } from '../../api/audit'
import type { AuditLogDetail } from '../../api/types'
import { AUDIT_ACTION_LABEL, AUDIT_TARGET_TYPE_LABEL } from '../../utils/constants'

/** 审计日志详情（F8） */
export default function AuditLogDetailPage() {
    const { id } = useParams<{ id: string }>()
    const logId = Number(id)

    const [detail, setDetail] = useState<AuditLogDetail | null>(null)
    const [loading, setLoading] = useState(true)

    const load = useCallback(async () => {
        if (!Number.isFinite(logId) || logId <= 0) return
        setLoading(true)
        try {
            setDetail(await getAuditLog(logId))
        } finally {
            setLoading(false)
        }
    }, [logId])

    useEffect(() => {
        void load()
    }, [load])

    if (loading && !detail) {
        return (
            <div style={{ padding: 80, textAlign: 'center' }}>
                <Spin size="large" />
            </div>
        )
    }

    if (!detail) {
        return <PageContainer title="审计详情" back>审计日志不存在</PageContainer>
    }

    return (
        <PageContainer
            title={AUDIT_ACTION_LABEL[detail.action] || detail.action}
            description={`日志 ID ${detail.id} · ${detail.createdAt}`}
            back
        >
            <Card title="操作信息">
                <Descriptions column={2} size="small">
                    <Descriptions.Item label="管理员">
                        {detail.adminName || `#${detail.adminId}`}（ID {detail.adminId}）
                    </Descriptions.Item>
                    <Descriptions.Item label="动作">
                        {AUDIT_ACTION_LABEL[detail.action] || detail.action}
                    </Descriptions.Item>
                    <Descriptions.Item label="对象类型">
                        {AUDIT_TARGET_TYPE_LABEL[detail.targetType] || detail.targetType}
                    </Descriptions.Item>
                    <Descriptions.Item label="对象 ID">{detail.targetId ?? '-'}</Descriptions.Item>
                    <Descriptions.Item label="家庭 ID">{detail.familyId ?? '-'}</Descriptions.Item>
                    <Descriptions.Item label="IP">{detail.ip || '-'}</Descriptions.Item>
                    <Descriptions.Item label="操作原因" span={2}>
                        {detail.reason || '-'}
                    </Descriptions.Item>
                </Descriptions>
            </Card>

            <Card title="变更对比">
                <JsonDiff before={detail.beforeData} after={detail.afterData} />
            </Card>
        </PageContainer>
    )
}
