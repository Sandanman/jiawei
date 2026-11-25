import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button, Card, Descriptions, Spin } from 'antd'
import { PageContainer, StatusTag } from '../../components'
import DangerConfirm from '../../components/danger-confirm'
import { cancelRewardOrder, getRewardOrder } from '../../api/reward-order'
import type { RewardOrderDetail } from '../../api/types'
import { REWARD_CATEGORY } from '../../utils/constants'
import { showSuccess } from '../../utils/message'

/** 兑换记录详情（F5） */
export default function RewardOrderDetailPage() {
    const { id } = useParams<{ id: string }>()
    const orderId = Number(id)

    const [detail, setDetail] = useState<RewardOrderDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [cancelOpen, setCancelOpen] = useState(false)

    const load = useCallback(async () => {
        if (!Number.isFinite(orderId) || orderId <= 0) return
        setLoading(true)
        try {
            setDetail(await getRewardOrder(orderId))
        } finally {
            setLoading(false)
        }
    }, [orderId])

    useEffect(() => {
        void load()
    }, [load])

    const handleCancel = async (reason: string) => {
        const result = await cancelRewardOrder(orderId, reason)
        showSuccess(
            result.refundedPoints > 0
                ? `兑换已撤销，已退还 ${result.refundedPoints} 积分`
                : '兑换已撤销'
        )
        setCancelOpen(false)
        await load()
    }

    if (loading && !detail) {
        return (
            <div style={{ padding: 80, textAlign: 'center' }}>
                <Spin size="large" />
            </div>
        )
    }

    if (!detail) {
        return <PageContainer title="兑换详情" back>兑换记录不存在或已被删除</PageContainer>
    }

    return (
        <PageContainer
            title={detail.rewardName}
            description={`兑换记录 ID ${detail.id}`}
            back
            extra={
                detail.status === 'pending' ? (
                    <Button danger onClick={() => setCancelOpen(true)}>
                        撤销兑换
                    </Button>
                ) : null
            }
        >
            <Card title="兑换信息">
                <Descriptions column={2} size="small">
                    <Descriptions.Item label="兑换记录 ID">{detail.id}</Descriptions.Item>
                    <Descriptions.Item label="状态">
                        <StatusTag type="reward" value={detail.status} />
                    </Descriptions.Item>
                    <Descriptions.Item label="奖励名称">{detail.rewardName}</Descriptions.Item>
                    <Descriptions.Item label="分类">
                        {REWARD_CATEGORY[detail.category] || detail.category}
                    </Descriptions.Item>
                    <Descriptions.Item label="消耗积分">{detail.rewardPoints}</Descriptions.Item>
                    <Descriptions.Item label="奖励 ID">{detail.rewardId}</Descriptions.Item>
                    <Descriptions.Item label="家庭">
                        <Link to={`/families/${detail.familyId}`}>
                            {detail.familyName || `家庭 ${detail.familyId}`}
                        </Link>
                    </Descriptions.Item>
                    <Descriptions.Item label="兑换人">
                        <Link to={`/users/${detail.userId}`}>
                            {detail.nickname || `用户 ${detail.userId}`}
                        </Link>
                    </Descriptions.Item>
                    <Descriptions.Item label="兑换时间">{detail.createdAt}</Descriptions.Item>
                    <Descriptions.Item label="领取时间">{detail.receivedAt || '-'}</Descriptions.Item>
                    <Descriptions.Item label="领取人 ID">{detail.receivedBy ?? '-'}</Descriptions.Item>
                    <Descriptions.Item label="备注">{detail.remark || '-'}</Descriptions.Item>
                </Descriptions>
            </Card>

            <DangerConfirm
                open={cancelOpen}
                title={`撤销兑换：${detail.rewardName}`}
                okText="确认撤销"
                impact={<div>撤销后将退还消耗的积分并归还库存，仅待领取状态可撤销。</div>}
                onCancel={() => setCancelOpen(false)}
                onConfirm={handleCancel}
            />
        </PageContainer>
    )
}
