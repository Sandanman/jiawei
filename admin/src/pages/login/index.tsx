import { useState } from 'react'
import { Button, Card, Form, Input, Typography } from 'antd'
import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../stores/auth-store'
import { showSuccess } from '../../utils/message'
import styles from './index.module.scss'

interface LoginForm {
    username: string
    password: string
}

/** 管理员登录（F1） */
export default function LoginPage() {
    const { login } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [loading, setLoading] = useState(false)

    const handleFinish = async (values: LoginForm) => {
        setLoading(true)
        try {
            await login(values.username.trim(), values.password)
            showSuccess('登录成功')
            const state = location.state as { from?: { pathname?: string } } | null
            navigate(state?.from?.pathname || '/families', { replace: true })
        } catch {
            // 失败提示由请求层统一处理（含锁定倒计时文案）
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className={styles.card}>
            <div className={styles.title}>
                <Typography.Title level={4} style={{ margin: 0 }}>
                    管理员登录
                </Typography.Title>
                <span className={styles.subtitle}>请使用后台账号登录</span>
            </div>
            <Form<LoginForm> layout="vertical" onFinish={handleFinish} autoComplete="off">
                <Form.Item
                    name="username"
                    label="账号"
                    rules={[{ required: true, message: '请输入账号' }]}
                >
                    <Input
                        size="large"
                        prefix={<UserOutlined />}
                        placeholder="请输入账号"
                        autoComplete="username"
                    />
                </Form.Item>
                <Form.Item
                    name="password"
                    label="密码"
                    rules={[{ required: true, message: '请输入密码' }]}
                >
                    <Input.Password
                        size="large"
                        prefix={<LockOutlined />}
                        placeholder="请输入密码"
                        autoComplete="current-password"
                    />
                </Form.Item>
                <Button type="primary" size="large" htmlType="submit" block loading={loading}>
                    登录
                </Button>
            </Form>
            <div className={styles.hint}>连续输错 5 次密码将锁定 15 分钟。</div>
        </Card>
    )
}
