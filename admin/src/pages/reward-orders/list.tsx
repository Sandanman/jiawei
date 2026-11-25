import { Card, DatePicker, Form, InputNumber, Select } from 'antd'
import type { TableProps } from 'antd'
import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import { DataTable, PageContainer, SearchForm, StatusTag } from '../../components'
import { listRewardOrders } from '../../api/reward-order'
import type { RewardOrderItem } from '../../api/types'
import {
    REWARD_CATEGORY,
    REWARD_CATEGORY_OPTIONS,
    REWARD_STATUS_OPTIONS
} from '../../utils/constants'
import { toDateBounds } from '../../utils/date'
import { useTableQuery } from '../../hooks/use-table-query'

interface RewardFilters {
    familyId?: number
    userId?: number
    status?: string
    category?: string
    createdFrom?: string
    createdTo?: string
}

/** 兑换记录列表（F5） */
export default function RewardOrderListPage() {
    const query = useTableQuery<RewardOrderItem, RewardFilters>(
        params => listRewardOrders(params),
        {}
    )

    const columns: TableProps<RewardOrderItem>['columns'] = [
        {
            title: '奖励名称',
            dataIndex: 'rewardName',
            width: 180,
            render: (value: string, row) => <Link to={`/reward-orders/${row.id}`}>{value}</Link>
        },
        {
            title: '分类',
            dataIndex: 'category',
            width: 100,
            render: (value: string) => REWARD_CATEGORY[value] || value
        },
        { title: '消耗积分', dataIndex: 'rewardPoints', width: 100, align: 'right' },
        {
            title: '家庭',
            dataIndex: 'familyName',
            width: 160,
            render: (value: string, row) => (
                <Link to={`/families/${row.familyId}`}>{value || `家庭 ${row.familyId}`}</Link>
            )
        },
        {
            title: '兑换人',
            dataIndex: 'nickname',
            width: 140,
            render: (value: string, row) => (
                <Link to={`/users/${row.userId}`}>{value || `用户 ${row.userId}`}</Link>
            )
        },
        {
            title: '状态',
            dataIndex: 'status',
            width: 100,
            render: (value: string) => <StatusTag type="reward" value={value} />
        },
        { title: '兑换时间', dataIndex: 'createdAt', width: 180 },
        {
            title: '操作',
            key: 'action',
            width: 90,
            fixed: 'right',
            render: (_, row) => <Link to={`/reward-orders/${row.id}`}>详情</Link>
        }
    ]

    const handleSearch = (values: Record<string, any>) => {
        const bounds = toDateBounds(values.createdRange)
        query.search({
            familyId: values.familyId,
            userId: values.userId,
            status: values.status,
            category: values.category,
            createdFrom: bounds.from,
            createdTo: bounds.to
        })
    }

    return (
        <PageContainer title="兑换记录" description="跨家庭查询积分兑换记录，必要时撤销待领取的兑换">
            <SearchForm loading={query.loading} onSearch={handleSearch} onReset={query.reset}>
                <Form.Item name="familyId" label="家庭 ID">
                    <InputNumber min={1} precision={0} placeholder="家庭 ID" style={{ width: 120 }} />
                </Form.Item>
                <Form.Item name="userId" label="用户 ID">
                    <InputNumber min={1} precision={0} placeholder="用户 ID" style={{ width: 120 }} />
                </Form.Item>
                <Form.Item name="status" label="状态">
                    <Select placeholder="全部" allowClear style={{ width: 120 }} options={REWARD_STATUS_OPTIONS} />
                </Form.Item>
                <Form.Item name="category" label="分类">
                    <Select placeholder="全部" allowClear style={{ width: 120 }} options={REWARD_CATEGORY_OPTIONS} />
                </Form.Item>
                <Form.Item name="createdRange" label="兑换时间">
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
