import type { ReactNode } from 'react'
import { Button } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import styles from './index.module.scss'

interface PageContainerProps {
    title: ReactNode
    description?: ReactNode
    extra?: ReactNode
    /** 显示返回按钮（详情页用） */
    back?: boolean
    children?: ReactNode
}

/** 页面容器：统一标题区与内容留白 */
export default function PageContainer({ title, description, extra, back, children }: PageContainerProps) {
    const navigate = useNavigate()

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div className={styles.titleArea}>
                    {back && (
                        <Button
                            type="text"
                            icon={<ArrowLeftOutlined />}
                            className={styles.back}
                            onClick={() => navigate(-1)}
                        />
                    )}
                    <div>
                        <div className={styles.title}>{title}</div>
                        {description && <div className={styles.description}>{description}</div>}
                    </div>
                </div>
                {extra && <div className={styles.extra}>{extra}</div>}
            </div>
            <div className={styles.body}>{children}</div>
        </div>
    )
}
