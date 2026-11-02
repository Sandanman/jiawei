import type { Season } from '../types/db'

/**
 * 按公历月份返回气象季节（北半球划分：3-5春 6-8夏 9-11秋 12-2冬）
 */
export function getCurrentSeason(date: Date = new Date()): Season {
    const month = date.getMonth() + 1
    if (month >= 3 && month <= 5) return '春'
    if (month >= 6 && month <= 8) return '夏'
    if (month >= 9 && month <= 11) return '秋'
    return '冬'
}
