import type { ReactNode } from 'react'
import styles from './index.module.scss'

interface JsonDiffProps {
    before?: unknown
    after?: unknown
}

function isPlainObject(value: unknown): value is Record<string, any> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function renderValue(value: unknown): ReactNode {
    if (value === null || value === undefined || value === '') return '—'
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
}

/** 审计详情：变更前后并排对比，差异行高亮 */
export default function JsonDiff({ before, after }: JsonDiffProps) {
    const beforeObj = isPlainObject(before) ? before : null
    const afterObj = isPlainObject(after) ? after : null

    if (!beforeObj && !afterObj) {
        return (
            <div className={styles.empty}>
                本次操作未记录字段级变更
                {(before !== null && before !== undefined) || (after !== null && after !== undefined)
                    ? `（变更前：${renderValue(before)}，变更后：${renderValue(after)}）`
                    : ''}
            </div>
        )
    }

    const keys = Array.from(
        new Set([...Object.keys(beforeObj || {}), ...Object.keys(afterObj || {})])
    )

    return (
        <div className={styles.wrap}>
            <div className={styles.column}>
                <div className={styles.columnTitle}>变更前</div>
                {keys.map(key => {
                    const prev = beforeObj?.[key]
                    const next = afterObj?.[key]
                    const changed = JSON.stringify(prev) !== JSON.stringify(next)
                    return (
                        <div
                            key={key}
                            className={`${styles.row} ${changed ? styles.rowChanged : ''}`}
                        >
                            <span className={styles.key}>{key}</span>
                            <span className={styles.value}>{renderValue(prev)}</span>
                        </div>
                    )
                })}
            </div>
            <div className={styles.column}>
                <div className={styles.columnTitle}>变更后</div>
                {keys.map(key => {
                    const prev = beforeObj?.[key]
                    const next = afterObj?.[key]
                    const changed = JSON.stringify(prev) !== JSON.stringify(next)
                    return (
                        <div
                            key={key}
                            className={`${styles.row} ${changed ? styles.rowChanged : ''}`}
                        >
                            <span className={styles.key}>{key}</span>
                            <span className={styles.value}>{renderValue(next)}</span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
