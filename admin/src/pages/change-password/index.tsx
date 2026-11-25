import { useState } from 'react'
import { Button, Card, Form, Input } from 'antd'
import { useNavigate } from 'react-router-dom'
import { changePassword } from '../../api/auth'
import { useAuth } from '../../stores/auth-store'
import { showSuccess } from '../../utils/message'
import PageContainer from '../../components/page-container'

interface PasswordForm {
    oldPassword: string
    newPassword: string
    confirmPassword: string
}

const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z0-9_!@#$%^&*.\-]{8,64}$/

/** 修改当前管理员密码（F1），成功后强制重新登录 */
export default function ChangePasswordPage() {
    const [form] = Form.useForm<PasswordForm>()
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()
    const { logout } = useAuth()

    const handleFinish = async (values: PasswordForm) => {
        setLoading(true)
        try {
            await changePassword(values.oldPassword, values.newPassword)
            showSuccess('密码已修改，请重新登录')
            logout()
            navigate('/login', { replace: true })
        } catch {
            // 错误提示由请求层统一处理
        } finally {
            setLoading(false)
        }
    }

    return (
        <PageContainer title="修改密码" description="修改后当前登录状态将失效，需要使用新密码重新登录">
            <Card>
                <Form<PasswordForm>
                    form={form}
                    layout="vertical"
                    style={{ maxWidth: 420 }}
                    onFinish={handleFinish}
                    autoComplete="off"
                >
                    <Form.Item
                        name="oldPassword"
                        label="旧密码"
                        rules={[{ required: true, message: '请输入旧密码' }]}
                    >
                        <Input.Password placeholder="请输入旧密码" autoComplete="current-password" />
                    </Form.Item>
                    <Form.Item
                        name="newPassword"
                        label="新密码"
                        rules={[
                            { required: true, message: '请输入新密码' },
                            {
                                pattern: PASSWORD_RULE,
                                message: '密码需 8–64 位且同时包含字母和数字'
                            }
                        ]}
                    >
                        <Input.Password placeholder="8–64 位，需包含字母和数字" autoComplete="new-password" />
                    </Form.Item>
                    <Form.Item
                        name="confirmPassword"
                        label="确认新密码"
                        dependencies={['newPassword']}
                        rules={[
                            { required: true, message: '请再次输入新密码' },
                            ({ getFieldValue }) => ({
                                validator: (_, value: string) =>
                                    !value || getFieldValue('newPassword') === value
                                        ? Promise.resolve()
                                        : Promise.reject(new Error('两次输入的密码不一致'))
                            })
                        ]}
                    >
                        <Input.Password placeholder="请再次输入新密码" autoComplete="new-password" />
                    </Form.Item>
                    <Form.Item style={{ marginBottom: 0 }}>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            确认修改
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </PageContainer>
    )
}
