import { useEffect, useState, type ReactNode } from 'react'
import { Form, Input, Modal } from 'antd'
import { REASON_MAX, REASON_MIN } from '../../utils/constants'
import styles from './index.module.scss'

interface DangerConfirmProps {
    open: boolean
    title: ReactNode
    /** 影响范围说明，显示在弹窗顶部 */
    impact?: ReactNode
    /** 需手动输入的目标名/编号，用于避免误操作 */
    confirmText?: string
    confirmTextLabel?: string
    okText?: string
    danger?: boolean
    onCancel: () => void
    /** 成功后由本组件关闭弹窗；失败时请抛出异常以保留弹窗 */
    onConfirm: (reason: string) => Promise<void>
}

interface FormValues {
    reason: string
    confirmText?: string
}

/** 高危操作二次确认：影响范围 + 必填原因（4-200 字）+ 可选文本校验 */
export default function DangerConfirm({
    open,
    title,
    impact,
    confirmText,
    confirmTextLabel = '目标名称',
    okText = '确认执行',
    danger = true,
    onCancel,
    onConfirm
}: DangerConfirmProps) {
    const [form] = Form.useForm<FormValues>()
    const [pending, setPending] = useState(false)

    useEffect(() => {
        if (open) {
            form.resetFields()
            setPending(false)
        }
    }, [open, form])

    const handleOk = async () => {
        const values = await form.validateFields()
        setPending(true)
        try {
            await onConfirm(values.reason.trim())
            onCancel()
        } catch {
            // 错误提示已由请求层统一处理，保留弹窗以便重试
        } finally {
            setPending(false)
        }
    }

    return (
        <Modal
            open={open}
            title={title}
            okText={okText}
            cancelText="取消"
            okButtonProps={{ danger }}
            confirmLoading={pending}
            onOk={handleOk}
            onCancel={onCancel}
            destroyOnHidden
            maskClosable={false}
        >
            {impact && <div className={styles.impact}>{impact}</div>}
            <Form form={form} layout="vertical">
                {confirmText !== undefined && (
                    <Form.Item
                        name="confirmText"
                        label={`请输入「${confirmTextLabel}」以确认`}
                        rules={[
                            { required: true, message: '请输入确认内容' },
                            {
                                validator: (_, value: string) =>
                                    value === confirmText
                                        ? Promise.resolve()
                                        : Promise.reject(new Error('输入内容不匹配'))
                            }
                        ]}
                    >
                        <Input placeholder={`请输入：${confirmText}`} autoComplete="off" />
                    </Form.Item>
                )}
                <Form.Item
                    name="reason"
                    label="操作原因"
                    extra={`${REASON_MIN}-${REASON_MAX} 字，将记入审计日志`}
                    rules={[
                        { required: true, message: '请填写操作原因' },
                        {
                            min: REASON_MIN,
                            max: REASON_MAX,
                            message: `操作原因需为 ${REASON_MIN}-${REASON_MAX} 字`
                        }
                    ]}
                >
                    <Input.TextArea
                        rows={3}
                        showCount
                        maxLength={REASON_MAX}
                        placeholder="请说明本次操作的原因"
                    />
                </Form.Item>
            </Form>
        </Modal>
    )
}
