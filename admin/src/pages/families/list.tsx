import { Card, Form, Input, Select } from 'antd'
import type { TableProps } from 'antd'
import { Link } from 'react-router-dom'
import { DataTable, PageContainer, SearchForm, StatusTag } from '../../components'
import { listFamilies } from '../../api/family'
import type { FamilyListItem } from '../../api/types'
import { FAMILY_STATUS_OPTIONS } from '../../utils/constants'
import { useTableQuery } from '../../hooks/use-table-query'

interface FamilyFilters {
    keyword?: string
    status?: number
}

/** 家庭列表（F2） */
export default function FamilyListPage() {
    const query = useTableQuery<FamilyListItem, FamilyFilters>(params => listFamilies(params), {})

    const columns: TableProps<FamilyListItem>['columns'] = [
        {
            title: '家庭名称',
            dataIndex: 'familyName',
            width: 200,
            render: (value: string, row) => <Link to={`/families/${row.id}`}>{value}</Link>
        },
        { title: '家庭编码', dataIndex: 'familyCode', width: 160 },
        {
            title: '房主',
            dataIndex: 'ownerNickname',
            width: 180,
            render: (value: string, row) =>
                value ? `${value}${row.ownerPhone ? `（${row.ownerPhone}）` : ''}` : '-'
        },
        {
            title: '状态',
            dataIndex: 'status',
            width: 100,
            render: (value: number) => <StatusTag type="family" value={value} />
        },
        { title: '成员数', dataIndex: 'memberCount', width: 90, align: 'right' },
        { title: '菜品数', dataIndex: 'dishCount', width: 90, align: 'right' },
        { title: '订单数', dataIndex: 'orderCount', width: 90, align: 'right' },
        { title: '创建时间', dataIndex: 'createdAt', width: 180 },
        {
            title: '操作',
            key: 'action',
            width: 90,
            fixed: 'right',
            render: (_, row) => <Link to={`/families/${row.id}`}>详情</Link>
        }
    ]

    const handleSearch = (values: Record<string, any>) => {
        query.search({
            keyword: values.keyword?.trim() || undefined,
            status: values.status
        })
    }

    return (
        <PageContainer title="家庭管理" description="查看家庭信息、成员与数据统计，可编辑信息或注销/恢复家庭">
            <SearchForm loading={query.loading} onSearch={handleSearch} onReset={query.reset}>
                <Form.Item name="keyword" label="关键词">
                    <Input placeholder="家庭名称 / 编码 / 房主昵称 / 手机号" allowClear style={{ width: 280 }} />
                </Form.Item>
                <Form.Item name="status" label="状态">
                    <Select placeholder="全部" allowClear style={{ width: 120 }} options={FAMILY_STATUS_OPTIONS} />
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
