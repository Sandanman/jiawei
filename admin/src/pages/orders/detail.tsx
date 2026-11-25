import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button, Card, Descriptions, Spin, Table } from 'antd'
import type { TableProps } from 'antd'
import { PageContainer, StatusTag } from '../../components'
import DangerConfirm from '../../components/danger-confirm'
import { cancelOrder, getOrder } from '../../api/order'
import type { OrderDetail, OrderItemRow, PointsRecordItem } from '../../api/types'
import { formatMoney } from '../../utils/format'
import { showSuccess } from '../../utils/message'

/** 订单详情（F5） */
export default function OrderDetailPage() {
    const { id } = useParams<{ id: string }>()
    const orderId = Number(id)

    const [detail, setDetail] = useState<OrderDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [cancelOpen, setCancelOpen] = useState(false)

    const load = useCallback(async () => {
        if (!Number.isFinite(orderId) || orderId <= 0) return
        setLoading(true)
        try {
            setDetail(await getOrder(orderId))
        } finally {
            setLoading(false)
        }
    }, [orderId])

    useEffect(() => {
        void load()
    }, [load])

    const handleCancel = async (reason: string) => {
        const result = await cancelOrder(orderId, reason)
        showSuccess(
            result.refundedPoints > 0
                ? `订单已取消，已退还 ${result.refundedPoints} 积分`
                : '订单已取消'
        )
        setCancelOpen(false)
        await load()
    }

    const itemColumns: TableProps<OrderItemRow>['columns'] = [
        { title: '菜品', dataIndex: 'dishName' },
        {
            title: '单价',
            dataIndex: 'price',
            width: 110,
            align: 'right',
            render: (value: number) => formatMoney(value)
        },
        { title: '积分', dataIndex: 'points', width: 90, align: 'right' },
        { title: '数量', dataIndex: 'quantity', width: 80, align: 'right' },
        {
            title: '小计',
            dataIndex: 'subtotal',
            width: 120,
            align: 'right',
            render: (value: number) => formatMoney(value)
        }
    ]

    const pointsColumns: TableProps<PointsRecordItem>['columns'] = [
        { title: '时间', dataIndex: 'createdAt', width: 180 },
        { title: '类型', dataIndex: 'type', width: 140 },
        {
            title: '变动',
            dataIndex: 'pointsChange',
            width: 100,
            align: 'right',
            render: (value: number) => (
                <span style={{ color: value >= 0 ? '#4cd964' : '#dd524d' }}>
                    {value > 0 ? `+${value}` : value}
                </span>
            )
        },
        { title: '余额', dataIndex: 'pointsBalance', width: 100, align: 'right' },
        { title: '说明', dataIndex: 'description', render: (value: string) => value || '-' }
    ]

    if (loading && !detail) {
        return (
            <div style={{ padding: 80, textAlign: 'center' }}>
                <Spin size="large" />
            </div>
        )
    }

    if (!detail) {
        return <PageContainer title="订单详情" back>订单不存在或已被删除</PageContainer>
    }

    const cancellable = detail.status === 'pending' || detail.status === 'confirmed'

    return (
        <PageContainer
            title={detail.orderNo}
            description={`订单 ID ${detail.id}`}
            back
            extra={
                cancellable ? (
                    <Button danger onClick={() => setCancelOpen(true)}>
                        强制取消订单
                    </Button>
                ) : null
            }
        >
            <Card title="订单信息">
                <Descriptions column={2} size="small">
                    <Descriptions.Item label="订单号">{detail.orderNo}</Descriptions.Item>
                    <Descriptions.Item label="状态">
                        <StatusTag type="order" value={detail.status} />
                    </Descriptions.Item>
                    <Descriptions.Item label="家庭">
                        <Link to={`/families/${detail.familyId}`}>
                            {detail.familyName || `家庭 ${detail.familyId}`}
                        </Link>
                    </Descriptions.Item>
                    <Descriptions.Item label="下单人">
                        <Link to={`/users/${detail.userId}`}>
                            {detail.nickname || `用户 ${detail.userId}`}
                        </Link>
                    </Descriptions.Item>
                    <Descriptions.Item label="订单金额">{formatMoney(detail.totalAmount)}</Descriptions.Item>
                    <Descriptions.Item label="消耗积分">{detail.totalPoints}</Descriptions.Item>
                    <Descriptions.Item label="创建时间">{detail.createdAt}</Descriptions.Item>
                    <Descriptions.Item label="备注">{detail.remark || '-'}</Descriptions.Item>
                </Descriptions>
            </Card>

            <Card title={`订单明细（${detail.items.length}）`}>
                <Table<OrderItemRow>
                    rowKey={row => `${row.dishId}-${row.price}-${row.points}`}
                    columns={itemColumns}
                    dataSource={detail.items}
                    pagination={false}
                    size="middle"
                    locale={{ emptyText: '暂无明细' }}
                />
            </Card>

            <Card title={`积分流水（${detail.pointsRecords.length}）`}>
                <Table<PointsRecordItem>
                    rowKey="id"
                    columns={pointsColumns}
                    dataSource={detail.pointsRecords}
                    pagination={false}
                    size="middle"
                    scroll={{ x: 'max-content' }}
                    locale={{ emptyText: '暂无流水' }}
                />
            </Card>

            <DangerConfirm
                open={cancelOpen}
                title={`强制取消订单：${detail.orderNo}`}
                okText="确认取消"
                impact={
                    <div>
                        取消后将归还菜品库存，并退还下单用户已扣积分（若订单消耗过积分）。此操作不可撤销。
                    </div>
                }
                onCancel={() => setCancelOpen(false)}
                onConfirm={handleCancel}
            />
        </PageContainer>
    )
}
