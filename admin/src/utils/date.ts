import type { Dayjs } from 'dayjs'

/** RangePicker 值 → 接口日期边界（YYYY-MM-DD） */
export function toDateBounds(
    range?: Array<Dayjs | null | undefined> | null
): { from?: string; to?: string } {
    if (!range || !range[0] || !range[1]) return {}
    return {
        from: range[0].format('YYYY-MM-DD'),
        to: range[1].format('YYYY-MM-DD')
    }
}
