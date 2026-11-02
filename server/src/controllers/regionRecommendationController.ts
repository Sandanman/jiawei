import { Request, Response } from 'express'
import { asyncHandler } from '../utils/asyncHandler'
import * as regionRecommendationService from '../services/regionRecommendationService'

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
 * Body: { location: string }
 */
export const reportUserRegionHandler = asyncHandler(async (req: AuthedRequest, res: Response) => {
    if (!req.userId) return res.fail('未登录', 401)

    const { location } = req.body || {}
    if (!location || typeof location !== 'string' || !location.trim()) {
        return res.fail('location 不能为空')
    }

    try {
        const regionCode = await regionRecommendationService.setUserRegion(req.userId, location)
        res.success({ regionCode })
    } catch (err) {
        res.fail((err as Error).message)
    }
})

/**
 * POST /api/v1/region-recommendation/run-now
 * [测试用] 手动触发一次当前所有 region_code 的推荐生成，跳过 03:00 定时等待
 * 仅用于本地验证 AI 生成链路，非 v1.1 正式接口，上线前应移除
 */
export const runRegionRecommendationNowHandler = asyncHandler(async (_req: AuthedRequest, res: Response) => {
    await regionRecommendationService.runDailyRegionRecommendationJob()
    res.success(null, '已触发一次地域推荐生成')
})
