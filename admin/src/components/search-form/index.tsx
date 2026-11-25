import type { ReactNode } from 'react'
import { Button, Form } from 'antd'
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import styles from './index.module.scss'

interface SearchFormProps {
    children: ReactNode
    initialValues?: Record<string, any>
    loading?: boolean
    onSearch: (values: Record<string, any>) => void
    onReset?: () => void
    extra?: ReactNode
}

/** 统一筛选栏：查询 / 重置 */
export default function SearchForm({
    children,
    initialValues,
    loading,
    onSearch,
    onReset,
    extra
}: SearchFormProps) {
    const [form] = Form.useForm()

    const handleReset = () => {
        form.resetFields()
        onReset?.()
    }

    return (
        <Form
            form={form}
            layout="inline"
            className={styles.form}
            initialValues={initialValues}
            onFinish={values => onSearch(values)}
        >
            {children}
            <Form.Item className={styles.actions}>
                <Button type="primary" htmlType="submit" icon={<SearchOutlined />} loading={loading}>
                    查询
                </Button>
                <Button icon={<ReloadOutlined />} onClick={handleReset}>
                    重置
                </Button>
                {extra}
            </Form.Item>
        </Form>
    )
}
