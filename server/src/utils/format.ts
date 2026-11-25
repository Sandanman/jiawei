/**
 * 格式化工具
 */

/**
 * 统一时间格式：YYYY-MM-DD HH:mm:ss（Asia/Shanghai）
 * 支持 Date、datetime 字符串、空值（返回 null）
 */
export function formatDateTime(value: Date | string | null | undefined): string | null {
    if (!value) return null
    if (typeof value === 'string') {
        const matched = value.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})/)
        if (matched) return `${matched[1]} ${matched[2]}`
        const parsed = new Date(value)
        if (Number.isNaN(parsed.getTime())) return value
        return formatDate(parsed)
    }
    return formatDate(value)
}

function formatDate(date: Date): string {
    return date.toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' }).replace('T', ' ')
}

/** 数字归一化，非法值返回 fallback */
export function toNumber(value: any, fallback = 0): number {
    const num = Number(value)
    return Number.isFinite(num) ? num : fallback
}
