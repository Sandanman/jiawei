/**
 * 地域化三餐推荐 API（v1.1）
 */
import { http } from '@/utils/request'
import type { RegionRecommendationToday } from './types'

/** 获取当前用户所在地域今日三餐推荐 */
export function getTodayRegionRecommendation() {
    return http.get<RegionRecommendationToday | null>('/v1/region-recommendation/today')
}

/** 上报用户位置（换算为 region_code） */
export function reportUserRegion(location: string) {
    return http.post<{ regionCode: string }>('/v1/user/region', { location })
}

/** [测试用] 手动触发一次地域推荐生成，跳过 03:00 定时等待 */
export function runRegionRecommendationNow() {
    return http.post<null>('/v1/region-recommendation/run-now')
}
