import { Card, DatePicker, Form, Input, InputNumber, Select } from 'antd'
import type { TableProps } from 'antd'
import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import { DataTable, PageContainer, SearchForm, StatusTag } from '../../components'
import { listOrders } from '../../api/order'
import type { OrderListItem } from '../../api/types'
import { ORDER_STATUS_OPTIONS } from '../../utils/constants'
import { formatMoney } from '../../utils/format'
import { toDateBounds } from '../../utils/date'
import { useTableQuery } from '../../hooks/use-table-query'

interface OrderFilters {
    familyId?: number
    userId?: number
    orderNo?: string
    status?: string
    createdFrom?: string
    createdTo?: string
}

/** 订单列表（F5） */
export default function OrderListPage() {
    const query = useTableQuery<OrderListItem, OrderFilters>(params => listOrders(params), {})

    const columns: TableProps<OrderListItem>['columns'] = [
        {
            title: '订单号',
            dataIndex: 'orderNo',
            width: 220,
            render: (value: string, row) => <Link to={`/orders/${row.id}`}>{value}</Link>
        },
        {
            title: '家庭',
            dataIndex: 'familyName',
            width: 160,
            render: (value: string, row) => (
                <Link to={`/families/${row.familyId}`}>{value || `家庭 ${row.familyId}`}</Link>
            )
        },
        {
            title: '下单人',
            dataIndex: 'nickname',
            width: 140,
            render: (value: string, row) => (
                <Link to={`/users/${row.userId}`}>{value || `用户 ${row.userId}`}</Link>
            )
        },
        {
            title: '订单金额',
            dataIndex: 'totalAmount',
            width: 110,
            align: 'right',
            render: (value: number) => formatMoney(value)
        },
        { title: '消耗积分', dataIndex: 'totalPoints', width: 100, align: 'right' },
        {
            title: '状态',
            dataIndex: 'status',
            width: 100,
            render: (value: string) => <StatusTag type="order" value={value} />
        },
        { title: '创建时间', dataIndex: 'createdAt', width: 180 },
        {
            title: '操作',
            key: 'action',
            width: 90,
            fixed: 'right',
            render: (_, row) => <Link to={`/orders/${row.id}`}>详情</Link>
        }
    ]

    const handleSearch = (values: Record<string, any>) => {
        const bounds = toDateBounds(values.createdRange)
        query.search({
            orderNo: values.orderNo?.trim() || undefined,
            familyId: values.familyId,
            userId: values.userId,
            status: values.status,
            createdFrom: bounds.from,
            createdTo: bounds.to
        })
    }

    return (
        <PageContainer title="订单管理" description="跨家庭查询订单，查看明细与积分流水，必要时强制取消">
            <SearchForm loading={query.loading} onSearch={handleSearch} onReset={query.reset}>
                <Form.Item name="orderNo" label="订单号">
                    <Input placeholder="精确订单号" allowClear style={{ width: 200 }} />
                </Form.Item>
                <Form.Item name="familyId" label="家庭 ID">
                    <InputNumber min={1} precision={0} placeholder="家庭 ID" style={{ width: 120 }} />
                </Form.Item>
                <Form.Item name="userId" label="用户 ID">
                    <InputNumber min={1} precision={0} placeholder="用户 ID" style={{ width: 120 }} />
                </Form.Item>
                <Form.Item name="status" label="状态">
                    <Select placeholder="全部" allowClear style={{ width: 120 }} options={ORDER_STATUS_OPTIONS} />
                </Form.Item>
                <Form.Item name="createdRange" label="创建时间">
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
