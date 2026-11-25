import { Button, Modal, Typography } from 'antd'
import type { ResetPasswordResult } from '../../api/types'

interface ResetPasswordModalProps {
    result: ResetPasswordResult | null
    onClose: () => void
}

/** 重置密码结果：明文仅展示一次，关闭后不可再看 */
export default function ResetPasswordModal({ result, onClose }: ResetPasswordModalProps) {
    return (
        <Modal
            open={result !== null}
            title="密码已重置"
            closable={false}
            maskClosable={false}
            destroyOnHidden
            footer={
                <Button type="primary" onClick={onClose}>
                    我已保存，关闭
                </Button>
            }
        >
            {result && (
                <div>
                    <p>
                        账号 <Typography.Text strong>{result.username}</Typography.Text>{' '}
                        的新密码如下，请立即复制并转交用户。关闭后无法再次查看。
                    </p>
                    <Typography.Text
                        copyable={{ text: result.newPassword, tooltips: ['复制密码', '已复制'] }}
                        code
                        style={{ fontSize: 16 }}
                    >
                        {result.newPassword}
                    </Typography.Text>
                </div>
            )}
        </Modal>
    )
}
