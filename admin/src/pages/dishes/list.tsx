import { useState } from 'react'
import {
    Button,
    Card,
    Drawer,
    Form,
    Input,
    InputNumber,
    Popconfirm,
    Select,
    Space,
    Tag
} from 'antd'
import type { TableProps } from 'antd'
import { App } from 'antd'
import { DataTable, PageContainer, SearchForm, StatusTag } from '../../components'
import DangerConfirm from '../../components/danger-confirm'
import { deleteDish, listDishes, publishDish, updateDish } from '../../api/dish'
import { ApiError } from '../../api/http'
import type { DishItem } from '../../api/types'
import { DISH_PUBLISH_OPTIONS } from '../../utils/constants'
import { formatMoney } from '../../utils/format'
import { showSuccess } from '../../utils/message'
import { useTableQuery } from '../../hooks/use-table-query'

interface DishFilters {
    familyId?: number
    keyword?: string
    category?: string
    isPublished?: number
    soldOut?: number
}

interface DishForm {
    name: string
    category?: string
    price: string
    points: number
    stock: number
    sortOrder: number
    description?: string
    imageUrl?: string
}

/** 菜品列表（F3）：跨家庭筛选 + 抽屉编辑 + 上下架 + 删除 */
export default function DishListPage() {
    const { modal } = App.useApp()
    const query = useTableQuery<DishItem, DishFilters>(params => listDishes(params), {})

    const [editing, setEditing] = useState<DishItem | null>(null)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState<DishItem | null>(null)
    const [publishingId, setPublishingId] = useState<number | null>(null)
    const [form] = Form.useForm<DishForm>()

    const openEdit = (dish: DishItem) => {
        form.setFieldsValue({
            name: dish.name,
            category: dish.category,
            price: dish.price.toFixed(2),
            points: dish.points,
            stock: dish.stock,
            sortOrder: dish.sortOrder,
            description: dish.description,
            imageUrl: dish.imageUrl
        })
        setEditing(dish)
    }

    const handleSave = async (values: DishForm) => {
        if (!editing) return
        setSaving(true)
        try {
            await updateDish(editing.id, {
                name: values.name.trim(),
                category: values.category?.trim() || '',
                price: values.price.trim(),
                points: values.points,
                stock: values.stock,
                sortOrder: values.sortOrder,
                description: values.description ?? '',
                imageUrl: values.imageUrl?.trim() || ''
            })
            showSuccess('已保存')
            setEditing(null)
            query.reload()
        } catch {
            // 错误提示由请求层统一处理
        } finally {
            setSaving(false)
        }
    }

    const handlePublish = async (dish: DishItem, nextPublished: boolean) => {
        setPublishingId(dish.id)
        try {
            await publishDish(dish.id, nextPublished)
            showSuccess(nextPublished ? '已上架' : '已下架')
            query.reload()
        } catch {
            // 错误提示由请求层统一处理
        } finally {
            setPublishingId(null)
        }
    }

    const handleDelete = async (reason: string) => {
        if (!deleting) return
        try {
            await deleteDish(deleting.id, reason)
            showSuccess('菜品已删除')
            setDeleting(null)
            query.reload()
        } catch (err) {
            const apiErr = err as ApiError
            if (apiErr?.data) {
                modal.error({
                    title: '菜品被引用，无法删除',
                    content: `关联奖励 ${apiErr.data.rewardCount ?? 0} 条，进行中订单 ${apiErr.data.openOrderCount ?? 0} 条。请先下架并处理引用后再删除。`
                })
            }
            throw err
        }
    }

    const columns: TableProps<DishItem>['columns'] = [
        { title: '菜品名称', dataIndex: 'name', width: 180 },
        { title: '所属家庭', dataIndex: 'familyName', width: 160, render: (v: string) => v || '-' },
        { title: '分类', dataIndex: 'category', width: 100, render: (v: string) => v || '-' },
        {
            title: '价格',
            dataIndex: 'price',
            width: 100,
            align: 'right',
            render: (v: number) => formatMoney(v)
        },
        { title: '积分', dataIndex: 'points', width: 80, align: 'right' },
        {
            title: '库存',
            dataIndex: 'stock',
            width: 90,
            align: 'right',
            render: (v: number) => (v > 0 ? v : <Tag color="red">售罄</Tag>)
        },
        {
            title: '状态',
            dataIndex: 'isPublished',
            width: 100,
            render: (v: number) => <StatusTag type="dishPublish" value={v} />
        },
        { title: '更新时间', dataIndex: 'updatedAt', width: 180 },
        {
            title: '操作',
            key: 'action',
            width: 220,
            fixed: 'right',
            render: (_, row) => (
                <Space size="small">
                    <Button type="link" size="small" onClick={() => openEdit(row)}>
                        编辑
                    </Button>
                    <Popconfirm
                        title={row.isPublished === 1 ? '确认下架该菜品？' : '确认上架该菜品？'}
                        okText="确认"
                        cancelText="取消"
                        onConfirm={() => handlePublish(row, row.isPublished !== 1)}
                    >
                        <Button
                            type="link"
                            size="small"
                            loading={publishingId === row.id}
                        >
                            {row.isPublished === 1 ? '下架' : '上架'}
                        </Button>
                    </Popconfirm>
                    <Button type="link" size="small" danger onClick={() => setDeleting(row)}>
                        删除
                    </Button>
                </Space>
            )
        }
    ]

    const handleSearch = (values: Record<string, any>) => {
        query.search({
            familyId: values.familyId,
            keyword: values.keyword?.trim() || undefined,
            category: values.category?.trim() || undefined,
            isPublished: values.isPublished,
            soldOut: values.soldOut
        })
    }

    return (
        <PageContainer title="菜品管理" description="跨家庭查看与管理菜品，编辑库存与价格、上下架或删除">
            <SearchForm loading={query.loading} onSearch={handleSearch} onReset={query.reset}>
                <Form.Item name="keyword" label="菜品名称">
                    <Input placeholder="请输入菜品名称" allowClear style={{ width: 200 }} />
                </Form.Item>
                <Form.Item name="familyId" label="家庭 ID">
                    <InputNumber min={1} precision={0} placeholder="家庭 ID" style={{ width: 130 }} />
                </Form.Item>
                <Form.Item name="category" label="分类">
                    <Input placeholder="分类" allowClear style={{ width: 120 }} />
                </Form.Item>
                <Form.Item name="isPublished" label="上架状态">
                    <Select
                        placeholder="全部"
                        allowClear
                        style={{ width: 120 }}
                        options={DISH_PUBLISH_OPTIONS}
                    />
                </Form.Item>
                <Form.Item name="soldOut" label="库存">
                    <Select
                        placeholder="全部"
                        allowClear
                        style={{ width: 120 }}
                        options={[{ label: '仅看售罄', value: 1 }]}
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

            <Drawer
                open={editing !== null}
                title={editing ? `编辑菜品：${editing.name}` : '编辑菜品'}
                width={520}
                destroyOnHidden
                onClose={() => setEditing(null)}
                extra={
                    <Space>
                        <Button onClick={() => setEditing(null)}>取消</Button>
                        <Button type="primary" loading={saving} onClick={() => form.submit()}>
                            保存
                        </Button>
                    </Space>
                }
            >
                <Form<DishForm> form={form} layout="vertical" onFinish={handleSave} autoComplete="off">
                    <Form.Item
                        name="name"
                        label="菜品名称"
                        rules={[
                            { required: true, message: '请输入菜品名称' },
                            { max: 64, message: '名称最多 64 个字符' }
                        ]}
                    >
                        <Input maxLength={64} placeholder="请输入菜品名称" />
                    </Form.Item>
                    <Form.Item name="category" label="分类" rules={[{ max: 32, message: '分类最多 32 个字符' }]}>
                        <Input maxLength={32} placeholder="如：家常菜" />
                    </Form.Item>
                    <Form.Item
                        name="price"
                        label="价格（元）"
                        rules={[
                            { required: true, message: '请输入价格' },
                            { pattern: /^\d+(\.\d{1,2})?$/, message: '价格最多两位小数' }
                        ]}
                    >
                        <Input placeholder="如 18.00" />
                    </Form.Item>
                    <Form.Item name="points" label="积分" rules={[{ required: true, message: '请输入积分' }]}>
                        <InputNumber min={0} precision={0} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item
                        name="stock"
                        label="库存"
                        extra="库存以保存时刻的值为准，不随订单自动扣减的计算方式调整"
                        rules={[{ required: true, message: '请输入库存' }]}
                    >
                        <InputNumber min={0} precision={0} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item
                        name="sortOrder"
                        label="排序值"
                        rules={[{ required: true, message: '请输入排序值' }]}
                    >
                        <InputNumber min={0} precision={0} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="description" label="描述" rules={[{ max: 512, message: '描述最多 512 个字符' }]}>
                        <Input.TextArea rows={3} maxLength={512} showCount placeholder="选填" />
                    </Form.Item>
                    <Form.Item
                        name="imageUrl"
                        label="图片地址"
                        rules={[
                            {
                                validator: (_, value: string) =>
                                    !value || /^https?:\/\//i.test(value)
                                        ? Promise.resolve()
                                        : Promise.reject(new Error('图片地址需以 http/https 开头'))
                            }
                        ]}
                    >
                        <Input placeholder="https://..." />
                    </Form.Item>
                </Form>
            </Drawer>

            <DangerConfirm
                open={deleting !== null}
                title={deleting ? `删除菜品：${deleting.name}` : '删除菜品'}
                impact={
                    <div>
                        删除后不可恢复。若菜品被奖励或进行中订单引用，将无法删除。
                    </div>
                }
                confirmText={deleting?.name}
                confirmTextLabel="菜品名称"
                okText="确认删除"
                onCancel={() => setDeleting(null)}
                onConfirm={handleDelete}
            />
        </PageContainer>
    )
}
