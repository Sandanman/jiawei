import type { ReactNode } from 'react'
import styles from './index.module.scss'

/** 登录 / 改密等未登录页面版式 */
export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className={styles.wrap}>
            <div className={styles.brand}>
                <span className={styles.mark}>家</span>
                <div>
                    <div className={styles.brandTitle}>家味小札</div>
                    <div className={styles.brandSub}>管理后台</div>
                </div>
            </div>
            <div className={styles.cardWrap}>{children}</div>
            <div className={styles.footer}>© {new Date().getFullYear()} 家味小札</div>
        </div>
    )
}
