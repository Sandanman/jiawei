import type { ReactNode } from 'react'
import { Table, type TableProps } from 'antd'

interface DataTableProps<T> {
    columns: TableProps<T>['columns']
    dataSource: T[]
    loading?: boolean
    total: number
    page: number
    pageSize: number
    onChange: (page: number, pageSize: number) => void
    rowKey?: TableProps<T>['rowKey']
    scrollX?: number | string | true
    emptyText?: ReactNode
}

/** 统一列表：分页参数转换、空态、加载态、横向滚动 */
export default function DataTable<T extends object>({
    columns,
    dataSource,
    loading,
    total,
    page,
    pageSize,
    onChange,
    rowKey = 'id',
    scrollX = 'max-content',
    emptyText = '暂无数据'
}: DataTableProps<T>) {
    return (
        <Table<T>
            rowKey={rowKey}
            columns={columns}
            dataSource={dataSource}
            loading={loading}
            scroll={{ x: scrollX }}
            locale={{ emptyText }}
            pagination={{
                current: page,
                pageSize,
                total,
                showSizeChanger: true,
                showQuickJumper: true,
                pageSizeOptions: ['10', '20', '50', '100'],
                showTotal: totalCount => `共 ${totalCount} 条`,
                onChange
            }}
        />
    )
}
