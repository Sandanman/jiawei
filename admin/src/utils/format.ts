/**
 * 展示格式化工具
 */

/** 金额：保留两位小数并加 ¥ 前缀 */
export function formatMoney(value: number | string | null | undefined): string {
    const num = Number(value)
    if (!Number.isFinite(num)) return '¥0.00'
    return `¥${num.toFixed(2)}`
}

/** 数字：空值兜底 0 */
export function formatNumber(value: number | string | null | undefined): string {
    const num = Number(value)
    if (!Number.isFinite(num)) return '0'
    return String(num)
}

/** 文本：空值显示占位符 */
export function formatText(value: string | null | undefined, placeholder = '-'): string {
    if (value === null || value === undefined) return placeholder
    const text = String(value).trim()
    return text || placeholder
}
