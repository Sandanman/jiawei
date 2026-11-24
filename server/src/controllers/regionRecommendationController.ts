import { Request, Response } from 'express'
import { asyncHandler } from '../utils/asyncHandler'
import * as regionRecommendationService from '../services/regionRecommendationService'
import type { SetUserRegionInput } from '../services/regionRecommendationService'
import { normalizePublicIp } from '../services/geoService'

type AuthedRequest = Request & { userId?: number }

/**
 * GET /api/v1/region-recommendation/today
 * 查询当前登录用户所在地域当日三餐推荐
 */
export const getTodayRegionRecommendationHandler = asyncHandler(async (req: AuthedRequest, res: Response) => {
    if (!req.userId) return res.fail('未登录', 401)

    const result = await regionRecommendationService.getTodayRecommendation(req.userId)
    if (!result) {
        return res.success(null, '请先获取位置后查看推荐')
    }
    res.success(result)
})

/**
 * POST /api/v1/user/region
 * Body（三选一）：
 *  - { source: 'gps', latitude: number, longitude: number }  经纬度，服务端逆地理编码
 *  - { source: 'ip' }                                        按请求 IP 定位（定位失败/拒绝授权时兜底）
 *  - { source: 'manual', adcode: string }                    手动选择城市（市级 adcode）
 */
export const reportUserRegionHandler = asyncHandler(async (req: AuthedRequest, res: Response) => {
    if (!req.userId) return res.fail('未登录', 401)

    const { source, latitude, longitude, adcode } = req.body || {}
    let input: SetUserRegionInput

    if (source === 'gps') {
        const lat = Number(latitude)
        const lng = Number(longitude)
        if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
            return res.fail('经纬度不合法')
        }
        input = { source, latitude: lat, longitude: lng }
    } else if (source === 'ip') {
        const ip = normalizePublicIp(req.ip)
        if (!ip) return res.fail('无法根据当前网络判断所在城市，请手动选择城市')
        input = { source, ip }
    } else if (source === 'manual') {
        if (typeof adcode !== 'string' || !/^\d{6}$/.test(adcode)) return res.fail('adcode 不合法')
        input = { source, adcode }
    } else {
        return res.fail('source 必须为 gps / ip / manual')
    }

    try {
        const result = await regionRecommendationService.setUserRegion(req.userId, input)
        res.success(result)
    } catch (err) {
        res.fail((err as Error).message)
    }
})

/**
 * POST /api/v1/region-recommendation/generate
 * 为当前用户所在地域按需生成当日推荐（切换城市后当日无记录、或上次生成失败后重试）
 */
export const generateMyRegionRecommendationHandler = asyncHandler(async (req: AuthedRequest, res: Response) => {
    if (!req.userId) return res.fail('未登录', 401)

    try {
        await regionRecommendationService.generateForUserRegion(req.userId)
        res.success(null)
    } catch (err) {
        res.fail((err as Error).message)
    }
})

/**
 * POST /api/v1/region-recommendation/run-now
 * [测试用] 手动触发一次当前所有地域的推荐生成，跳过 03:00 定时等待
 * 仅用于本地验证 AI 生成链路，非 v1.1 正式接口，上线前应移除
 */
export const runRegionRecommendationNowHandler = asyncHandler(async (_req: AuthedRequest, res: Response) => {
    await regionRecommendationService.runDailyRegionRecommendationJob()
    res.success(null, '已触发一次地域推荐生成')
})
