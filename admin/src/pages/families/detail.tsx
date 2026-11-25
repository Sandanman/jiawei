import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
    Button,
    Card,
    Col,
    Descriptions,
    Form,
    Input,
    Modal,
    Row,
    Space,
    Spin,
    Statistic,
    Table,
    Tag
} from 'antd'
import type { TableProps } from 'antd'
import { PageContainer, StatusTag } from '../../components'
import DangerConfirm from '../../components/danger-confirm'
import { closeFamily, getCloseImpact, getFamily, restoreFamily, updateFamily } from '../../api/family'
import type { CloseImpact, FamilyDetail, FamilyMember } from '../../api/types'
import { MEMBER_ROLE } from '../../utils/constants'
import { showSuccess } from '../../utils/message'

interface EditForm {
    familyName: string
    description?: string
}

type DangerType = 'close' | 'restore'

/** 家庭详情（F2） */
export default function FamilyDetailPage() {
    const { id } = useParams<{ id: string }>()
    const familyId = Number(id)

    const [detail, setDetail] = useState<FamilyDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [editOpen, setEditOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [dangerType, setDangerType] = useState<DangerType | null>(null)
    const [impact, setImpact] = useState<CloseImpact | null>(null)
    const [form] = Form.useForm<EditForm>()

    const load = useCallback(async () => {
        if (!Number.isFinite(familyId) || familyId <= 0) return
        setLoading(true)
        try {
            setDetail(await getFamily(familyId))
        } finally {
            setLoading(false)
        }
    }, [familyId])

    useEffect(() => {
        void load()
    }, [load])

    const openEdit = () => {
        if (!detail) return
        form.setFieldsValue({
            familyName: detail.familyName,
            description: detail.description
        })
        setEditOpen(true)
    }

    const handleEditSubmit = async (values: EditForm) => {
        setSaving(true)
        try {
            await updateFamily(familyId, {
                familyName: values.familyName.trim(),
                description: values.description ?? ''
            })
            showSuccess('已保存')
            setEditOpen(false)
            await load()
        } finally {
            setSaving(false)
        }
    }

    const openDanger = async (type: DangerType) => {
        setImpact(null)
        setDangerType(type)
        if (type === 'close') {
            try {
                setImpact(await getCloseImpact(familyId))
            } catch {
                // 影响范围获取失败不阻断确认流程
            }
        }
    }

    const handleDangerConfirm = async (reason: string) => {
        if (!detail || !dangerType) return
        if (dangerType === 'close') {
            await closeFamily(familyId, reason)
            showSuccess('家庭已注销')
        } else {
            await restoreFamily(familyId, reason)
            showSuccess('家庭已恢复')
        }
        setDangerType(null)
        await load()
    }

    const memberColumns: TableProps<FamilyMember>['columns'] = [
        { title: '用户 ID', dataIndex: 'userId', width: 90 },
        { title: '昵称', dataIndex: 'nickname', width: 160 },
        { title: '手机号', dataIndex: 'phone', width: 140, render: (value: string) => value || '-' },
        {
            title: '角色',
            dataIndex: 'role',
            width: 100,
            render: (value: string) => (
                <Tag color={value === 'owner' ? 'orange' : value === 'admin' ? 'blue' : 'default'}>
                    {MEMBER_ROLE[value] || value}
                </Tag>
            )
        },
        { title: '积分', dataIndex: 'points', width: 100, align: 'right' },
        { title: '加入时间', dataIndex: 'joinedAt', width: 180 },
        { title: '备注', dataIndex: 'adminRemark', render: (value: string) => value || '-' }
    ]

    if (loading && !detail) {
        return (
            <div style={{ padding: 80, textAlign: 'center' }}>
                <Spin size="large" />
            </div>
        )
    }

    if (!detail) {
        return <PageContainer title="家庭详情" back>家庭不存在或已被删除</PageContainer>
    }

    return (
        <PageContainer
            title={detail.familyName}
            description={`家庭编码 ${detail.familyCode}`}
            back
            extra={
                <Space>
                    <Button onClick={openEdit}>编辑信息</Button>
                    {detail.status === 1 ? (
                        <Button danger onClick={() => openDanger('close')}>
                            注销家庭
                        </Button>
                    ) : (
                        <Button type="primary" onClick={() => openDanger('restore')}>
                            恢复家庭
                        </Button>
                    )}
                </Space>
            }
        >
            <Card title="基本信息">
                <Descriptions column={2} size="small">
                    <Descriptions.Item label="家庭 ID">{detail.id}</Descriptions.Item>
                    <Descriptions.Item label="状态">
                        <StatusTag type="family" value={detail.status} />
                    </Descriptions.Item>
                    <Descriptions.Item label="房主 ID">{detail.ownerId}</Descriptions.Item>
                    <Descriptions.Item label="创建时间">{detail.createdAt}</Descriptions.Item>
                    <Descriptions.Item label="更新时间">{detail.updatedAt}</Descriptions.Item>
                    <Descriptions.Item label="家庭描述" span={2}>
                        {detail.description || '-'}
                    </Descriptions.Item>
                </Descriptions>
            </Card>

            <Card title="数据统计">
                <Row gutter={24}>
                    <Col span={4}>
                        <Statistic title="成员" value={detail.members.length} />
                    </Col>
                    <Col span={4}>
                        <Statistic title="菜品" value={detail.stats.dishCount} />
                    </Col>
                    <Col span={4}>
                        <Statistic title="订单" value={detail.stats.orderCount} />
                    </Col>
                    <Col span={4}>
                        <Statistic title="任务" value={detail.stats.taskCount} />
                    </Col>
                    <Col span={4}>
                        <Statistic title="奖励" value={detail.stats.rewardCount} />
                    </Col>
                </Row>
            </Card>

            <Card title={`成员列表（${detail.members.length}）`}>
                <Table<FamilyMember>
                    rowKey="userId"
                    columns={memberColumns}
                    dataSource={detail.members}
                    pagination={false}
                    size="middle"
                    scroll={{ x: 'max-content' }}
                    locale={{ emptyText: '暂无成员' }}
                />
            </Card>

            <Modal
                open={editOpen}
                title="编辑家庭信息"
                okText="保存"
                cancelText="取消"
                confirmLoading={saving}
                onOk={() => form.submit()}
                onCancel={() => setEditOpen(false)}
                destroyOnHidden
            >
                <Form<EditForm> form={form} layout="vertical" onFinish={handleEditSubmit}>
                    <Form.Item
                        name="familyName"
                        label="家庭名称"
                        rules={[
                            { required: true, message: '请输入家庭名称' },
                            { max: 64, message: '家庭名称最多 64 个字符' }
                        ]}
                    >
                        <Input placeholder="请输入家庭名称" maxLength={64} />
                    </Form.Item>
                    <Form.Item
                        name="description"
                        label="家庭描述"
                        rules={[{ max: 255, message: '描述最多 255 个字符' }]}
                    >
                        <Input.TextArea rows={3} maxLength={255} showCount placeholder="选填" />
                    </Form.Item>
                </Form>
            </Modal>

            <DangerConfirm
                open={dangerType !== null}
                title={dangerType === 'close' ? '注销家庭' : '恢复家庭'}
                danger={dangerType === 'close'}
                okText={dangerType === 'close' ? '确认注销' : '确认恢复'}
                confirmText={dangerType === 'close' ? detail.familyName : undefined}
                confirmTextLabel="家庭名称"
                impact={
                    dangerType === 'close' && impact ? (
                        <div>
                            <div style={{ fontWeight: 600, marginBottom: 4 }}>注销影响范围</div>
                            <ul style={{ margin: 0, paddingLeft: 18 }}>
                                <li>家庭成员 {impact.memberCount} 人</li>
                                <li>未完成订单 {impact.openOrderCount} 单</li>
                                <li>进行中任务 {impact.openTaskCount} 个</li>
                                <li>待领取兑换 {impact.pendingRewardOrderCount} 条</li>
                            </ul>
                        </div>
                    ) : null
                }
                onCancel={() => setDangerType(null)}
                onConfirm={handleDangerConfirm}
            />
        </PageContainer>
    )
}
