import { Card, DatePicker, Form, Input, InputNumber, Select } from 'antd'
import type { TableProps } from 'antd'
import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import { DataTable, PageContainer, SearchForm } from '../../components'
import { listAuditLogs } from '../../api/audit'
import type { AuditLogItem } from '../../api/types'
import { AUDIT_ACTION_LABEL, AUDIT_TARGET_TYPE_LABEL } from '../../utils/constants'
import { toDateBounds } from '../../utils/date'
import { useTableQuery } from '../../hooks/use-table-query'

interface AuditFilters {
    adminId?: number
    action?: string
    targetType?: string
    targetId?: string
    familyId?: number
    from?: string
    to?: string
}

const ACTION_OPTIONS = Object.entries(AUDIT_ACTION_LABEL).map(([value, label]) => ({ value, label }))
const TARGET_TYPE_OPTIONS = Object.entries(AUDIT_TARGET_TYPE_LABEL).map(([value, label]) => ({
    value,
    label
}))

/** 审计日志列表（F8，只读） */
export default function AuditLogListPage() {
    const query = useTableQuery<AuditLogItem, AuditFilters>(params => listAuditLogs(params), {})

    const columns: TableProps<AuditLogItem>['columns'] = [
        { title: '时间', dataIndex: 'createdAt', width: 180 },
        {
            title: '管理员',
            dataIndex: 'adminName',
            width: 140,
            render: (value: string, row) => (value ? `${value}（${row.adminId}）` : `#${row.adminId}`)
        },
        {
            title: '动作',
            dataIndex: 'action',
            width: 150,
            render: (value: string) => AUDIT_ACTION_LABEL[value] || value
        },
        {
            title: '操作对象',
            key: 'target',
            width: 150,
            render: (_, row) =>
                `${AUDIT_TARGET_TYPE_LABEL[row.targetType] || row.targetType}${
                    row.targetId !== null ? ` #${row.targetId}` : ''
                }`
        },
        {
            title: '家庭 ID',
            dataIndex: 'familyId',
            width: 100,
            render: (value: number | null) =>
                value ? <Link to={`/families/${value}`}>{value}</Link> : '-'
        },
        { title: 'IP', dataIndex: 'ip', width: 140, render: (value: string) => value || '-' },
        {
            title: '操作原因',
            dataIndex: 'reason',
            width: 220,
            ellipsis: true,
            render: (value: string) => value || '-'
        },
        {
            title: '操作',
            key: 'action',
            width: 90,
            fixed: 'right',
            render: (_, row) => <Link to={`/audit-logs/${row.id}`}>详情</Link>
        }
    ]

    const handleSearch = (values: Record<string, any>) => {
        const bounds = toDateBounds(values.createdRange)
        query.search({
            adminId: values.adminId,
            action: values.action,
            targetType: values.targetType,
            targetId: values.targetId?.trim() || undefined,
            familyId: values.familyId,
            from: bounds.from,
            to: bounds.to
        })
    }

    return (
        <PageContainer title="审计日志" description="记录所有后台高危操作，只读不可修改">
            <SearchForm loading={query.loading} onSearch={handleSearch} onReset={query.reset}>
                <Form.Item name="adminId" label="管理员 ID">
                    <InputNumber min={1} precision={0} placeholder="管理员 ID" style={{ width: 120 }} />
                </Form.Item>
                <Form.Item name="action" label="动作">
                    <Select placeholder="全部" allowClear style={{ width: 170 }} options={ACTION_OPTIONS} />
                </Form.Item>
                <Form.Item name="targetType" label="对象类型">
                    <Select
                        placeholder="全部"
                        allowClear
                        style={{ width: 130 }}
                        options={TARGET_TYPE_OPTIONS}
                    />
                </Form.Item>
                <Form.Item name="targetId" label="对象 ID">
                    <Input placeholder="对象 ID" allowClear style={{ width: 120 }} />
                </Form.Item>
                <Form.Item name="familyId" label="家庭 ID">
                    <InputNumber min={1} precision={0} placeholder="家庭 ID" style={{ width: 120 }} />
                </Form.Item>
                <Form.Item name="createdRange" label="时间">
                    <DatePicker.RangePicker allowClear maxDate={dayjs()} style={{ width: 260 }} />
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
        </PageContainer>
    )
}
