import { useState } from 'react'
import { App, Button, Card, DatePicker, Form, Input, Select, Space } from 'antd'
import type { TableProps } from 'antd'
import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import { DataTable, PageContainer, SearchForm, StatusTag } from '../../components'
import DangerConfirm from '../../components/danger-confirm'
import { disableUser, enableUser, listUsers, resetUserPassword } from '../../api/user'
import type { ResetPasswordResult, UserListItem } from '../../api/types'
import { USER_STATUS_OPTIONS } from '../../utils/constants'
import { showSuccess } from '../../utils/message'
import { toDateBounds } from '../../utils/date'
import { useTableQuery } from '../../hooks/use-table-query'
import ResetPasswordModal from './reset-password-modal'

interface UserFilters {
    keyword?: string
    status?: number
    createdFrom?: string
    createdTo?: string
}

type UserAction = 'disable' | 'enable' | 'reset-password'

interface PendingAction {
    type: UserAction
    user: UserListItem
}

const ACTION_CONFIG: Record<UserAction, { title: (name: string) => string; okText: string; danger: boolean }> = {
    disable: { title: name => `禁用用户：${name}`, okText: '确认禁用', danger: true },
    enable: { title: name => `启用用户：${name}`, okText: '确认启用', danger: false },
    'reset-password': { title: name => `重置密码：${name}`, okText: '确认重置', danger: true }
}

/** 用户列表（F4） */
export default function UserListPage() {
    const { modal } = App.useApp()
    const query = useTableQuery<UserListItem, UserFilters>(params => listUsers(params), {})

    const [pending, setPending] = useState<PendingAction | null>(null)
    const [resetResult, setResetResult] = useState<ResetPasswordResult | null>(null)

    const handleConfirm = async (reason: string) => {
        if (!pending) return
        const { type, user } = pending

        if (type === 'disable') {
            const result = await disableUser(user.id, reason)
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
            query.reload()
        } else if (type === 'enable') {
            await enableUser(user.id, reason)
            showSuccess('用户已启用')
            query.reload()
        } else {
            const result = await resetUserPassword(user.id, reason)
            setResetResult(result)
        }

        setPending(null)
    }

    const columns: TableProps<UserListItem>['columns'] = [
        { title: '用户 ID', dataIndex: 'id', width: 90 },
        {
            title: '昵称',
            dataIndex: 'nickname',
            width: 160,
            render: (value: string, row) => <Link to={`/users/${row.id}`}>{value || `用户 ${row.id}`}</Link>
        },
        { title: '手机号', dataIndex: 'phone', width: 140, render: (v: string) => v || '-' },
        { title: '地区', dataIndex: 'regionName', width: 140, render: (v: string) => v || '-' },
        { title: '家庭数', dataIndex: 'familyCount', width: 90, align: 'right' },
        {
            title: '状态',
            dataIndex: 'status',
            width: 100,
            render: (v: number) => <StatusTag type="user" value={v} />
        },
        { title: '注册时间', dataIndex: 'createdAt', width: 180 },
        {
            title: '操作',
            key: 'action',
            width: 240,
            fixed: 'right',
            render: (_, row) => (
                <Space size="small">
                    <Link to={`/users/${row.id}`}>详情</Link>
                    {row.status === 1 ? (
                        <Button
                            type="link"
                            size="small"
                            danger
                            onClick={() => setPending({ type: 'disable', user: row })}
                        >
                            禁用
                        </Button>
                    ) : (
                        <Button
                            type="link"
                            size="small"
                            onClick={() => setPending({ type: 'enable', user: row })}
                        >
                            启用
                        </Button>
                    )}
                    <Button
                        type="link"
                        size="small"
                        onClick={() => setPending({ type: 'reset-password', user: row })}
                    >
                        重置密码
                    </Button>
                </Space>
            )
        }
    ]

    const handleSearch = (values: Record<string, any>) => {
        const bounds = toDateBounds(values.createdRange)
        query.search({
            keyword: values.keyword?.trim() || undefined,
            status: values.status,
            createdFrom: bounds.from,
            createdTo: bounds.to
        })
    }

    const config = pending ? ACTION_CONFIG[pending.type] : null

    return (
        <PageContainer title="用户管理" description="查看用户与账号信息，禁用/启用用户或重置登录密码">
            <SearchForm loading={query.loading} onSearch={handleSearch} onReset={query.reset}>
                <Form.Item name="keyword" label="关键词">
                    <Input placeholder="用户 ID / 昵称 / 手机号 / 账号" allowClear style={{ width: 260 }} />
                </Form.Item>
                <Form.Item name="status" label="状态">
                    <Select placeholder="全部" allowClear style={{ width: 120 }} options={USER_STATUS_OPTIONS} />
                </Form.Item>
                <Form.Item name="createdRange" label="注册时间">
                    <DatePicker.RangePicker
                        allowClear
                        maxDate={dayjs()}
                        style={{ width: 260 }}
                    />
                </Form.Item>
            </SearchForm>
            <Card styles={{ body: { padding: 0 } }}>
                <DataTable
                    columns={columns}
                    dataSource={query.data}
                    loading={query.loading}
                    total={query.total}
                    page={query.page}
                    pageSize={query.pageSize}
                    onChange={query.changePage}
                />
            </Card>

            <DangerConfirm
                open={pending !== null}
                title={pending && config ? config.title(pending.user.nickname || `用户 ${pending.user.id}`) : ''}
                danger={config?.danger}
                okText={config?.okText}
                confirmText={
                    pending
                        ? pending.user.nickname || String(pending.user.id)
                        : undefined
                }
                confirmTextLabel="用户昵称或 ID"
                impact={
                    pending?.type === 'disable'
                        ? '禁用后该用户将无法登录业务端，其担任房主的家庭将暂时失去管理。'
                        : pending?.type === 'reset-password'
                          ? '重置后原密码立即失效，新密码仅展示一次。'
                          : null
                }
                onCancel={() => setPending(null)}
                onConfirm={handleConfirm}
            />

            <ResetPasswordModal result={resetResult} onClose={() => setResetResult(null)} />
        </PageContainer>
    )
}
