/**
 * 地域化三餐推荐 API（v1.1）
 */
import { http } from '@/utils/request'
import type { RegionRecommendationToday, ReportRegionPayload, UserRegionResult } from './types'

/** 获取当前用户所在地域今日三餐推荐 */
export function getTodayRegionRecommendation() {
    return http.get<RegionRecommendationToday | null>('/v1/region-recommendation/today')
}

/** 上报用户所在地域：gps 经纬度 / ip 兜底定位 / manual 手动选城市（服务端统一换算为市级 adcode） */
export function reportUserRegion(payload: ReportRegionPayload) {
    return http.post<UserRegionResult>('/v1/user/region', payload)
}

/** 为当前用户所在地域按需生成当日推荐（切换城市后无记录 / 上次失败重试），已有成功记录时服务端直接返回 */
export function generateMyRegionRecommendation() {
    return http.post<null>('/v1/region-recommendation/generate')
}

/** [测试用] 手动触发一次地域推荐生成，跳过 03:00 定时等待 */
export function runRegionRecommendationNow() {
    return http.post<null>('/v1/region-recommendation/run-now')
}
