import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { App, Button, Card, Descriptions, Space, Spin, Table } from 'antd'
import type { TableProps } from 'antd'
import { Link } from 'react-router-dom'
import { PageContainer, StatusTag } from '../../components'
import DangerConfirm from '../../components/danger-confirm'
import { disableUser, enableUser, getUser, resetUserPassword } from '../../api/user'
import type { ResetPasswordResult, UserDetail, UserFamily } from '../../api/types'
import { MEMBER_ROLE } from '../../utils/constants'
import { showSuccess } from '../../utils/message'
import ResetPasswordModal from './reset-password-modal'

type UserAction = 'disable' | 'enable' | 'reset-password'

/** 用户详情（F4） */
export default function UserDetailPage() {
    const { id } = useParams<{ id: string }>()
    const userId = Number(id)
    const { modal } = App.useApp()

    const [detail, setDetail] = useState<UserDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [action, setAction] = useState<UserAction | null>(null)
    const [resetResult, setResetResult] = useState<ResetPasswordResult | null>(null)

    const load = useCallback(async () => {
        if (!Number.isFinite(userId) || userId <= 0) return
        setLoading(true)
        try {
            setDetail(await getUser(userId))
        } finally {
            setLoading(false)
        }
    }, [userId])

    useEffect(() => {
        void load()
    }, [load])

    const handleConfirm = async (reason: string) => {
        if (!action) return
        if (action === 'disable') {
            const result = await disableUser(userId, reason)
            showSuccess('用户已禁用')
            if (result.ownedFamilies && result.ownedFamilies.length > 0) {
                modal.warning({
                    title: '该用户担任以下家庭的房主',
                    content: (
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                            {result.ownedFamilies.map(family => (
                                <li key={family.id}>
                                    {family.familyName}（ID {family.id}）
                                </li>
                            ))}
                        </ul>
                    )
                })
            }
            await load()
        } else if (action === 'enable') {
            await enableUser(userId, reason)
            showSuccess('用户已启用')
            await load()
        } else {
            setResetResult(await resetUserPassword(userId, reason))
        }
        setAction(null)
    }

    const familyColumns: TableProps<UserFamily>['columns'] = [
        {
            title: '家庭 ID',
            dataIndex: 'familyId',
            width: 100,
            render: (value: number) => <Link to={`/families/${value}`}>{value}</Link>
        },
        {
            title: '家庭名称',
            dataIndex: 'familyName',
            render: (value: string, row) => <Link to={`/families/${row.familyId}`}>{value}</Link>
        },
        {
            title: '角色',
            dataIndex: 'role',
            width: 100,
            render: (value: string) => MEMBER_ROLE[value] || value
        },
        { title: '积分', dataIndex: 'points', width: 100, align: 'right' },
        {
            title: '家庭状态',
            dataIndex: 'familyStatus',
            width: 110,
            render: (value: number) => <StatusTag type="family" value={value} />
        }
    ]

    if (loading && !detail) {
        return (
            <div style={{ padding: 80, textAlign: 'center' }}>
                <Spin size="large" />
            </div>
        )
    }

    if (!detail) {
        return <PageContainer title="用户详情" back>用户不存在或已被删除</PageContainer>
    }

    return (
        <PageContainer
            title={detail.nickname || `用户 ${detail.id}`}
            description={`用户 ID ${detail.id}`}
            back
            extra={
                <Space>
                    {detail.status === 1 ? (
                        <Button danger onClick={() => setAction('disable')}>
                            禁用用户
                        </Button>
                    ) : (
                        <Button type="primary" onClick={() => setAction('enable')}>
                            启用用户
                        </Button>
                    )}
                    <Button onClick={() => setAction('reset-password')}>重置密码</Button>
                </Space>
            }
        >
            <Card title="基本信息">
                <Descriptions column={2} size="small">
                    <Descriptions.Item label="用户 ID">{detail.id}</Descriptions.Item>
                    <Descriptions.Item label="状态">
                        <StatusTag type="user" value={detail.status} />
                    </Descriptions.Item>
                    <Descriptions.Item label="昵称">{detail.nickname || '-'}</Descriptions.Item>
                    <Descriptions.Item label="手机号">{detail.phone || '-'}</Descriptions.Item>
                    <Descriptions.Item label="地区">
                        {detail.regionName || '-'}
                        {detail.regionCode ? `（${detail.regionCode}）` : ''}
                    </Descriptions.Item>
                    <Descriptions.Item label="地区来源">{detail.regionSource || '-'}</Descriptions.Item>
                    <Descriptions.Item label="注册时间" span={2}>
                        {detail.createdAt}
                    </Descriptions.Item>
                </Descriptions>
            </Card>

            <Card title="账号信息">
                {detail.account ? (
                    <Descriptions column={2} size="small">
                        <Descriptions.Item label="登录账号">{detail.account.username}</Descriptions.Item>
                        <Descriptions.Item label="登录方式">{detail.account.loginType}</Descriptions.Item>
                        <Descriptions.Item label="账号状态">
                            {detail.account.status === 1 ? '正常' : '停用'}
                        </Descriptions.Item>
                        <Descriptions.Item label="最后登录">
                            {detail.account.lastLoginAt || '-'}
                        </Descriptions.Item>
                    </Descriptions>
                ) : (
                    <span style={{ color: 'var(--admin-text-secondary)' }}>该用户暂无登录账号</span>
                )}
            </Card>

            <Card title={`所属家庭（${detail.families.length}）`}>
                <Table<UserFamily>
                    rowKey="familyId"
                    columns={familyColumns}
                    dataSource={detail.families}
                    pagination={false}
                    size="middle"
                    scroll={{ x: 'max-content' }}
                    locale={{ emptyText: '暂无家庭' }}
                />
            </Card>

            <DangerConfirm
                open={action !== null}
                title={
                    action === 'disable'
                        ? `禁用用户：${detail.nickname || detail.id}`
                        : action === 'enable'
                          ? `启用用户：${detail.nickname || detail.id}`
                          : `重置密码：${detail.nickname || detail.id}`
                }
                danger={action !== 'enable'}
                okText={action === 'reset-password' ? '确认重置' : '确认'}
                confirmText={detail.nickname || String(detail.id)}
                confirmTextLabel="用户昵称或 ID"
                impact={
                    action === 'disable'
                        ? '禁用后该用户将无法登录业务端，其担任房主的家庭将暂时失去管理。'
                        : action === 'reset-password'
                          ? '重置后原密码立即失效，新密码仅展示一次。'
                          : null
                }
                onCancel={() => setAction(null)}
                onConfirm={handleConfirm}
            />

            <ResetPasswordModal result={resetResult} onClose={() => setResetResult(null)} />
        </PageContainer>
    )
}
