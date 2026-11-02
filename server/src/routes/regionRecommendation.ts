import { Router } from 'express'
import { authRequired } from '../middlewares/auth'
import {
    getTodayRegionRecommendationHandler,
    reportUserRegionHandler,
    runRegionRecommendationNowHandler
} from '../controllers/regionRecommendationController'

const router: Router = Router()

router.use(authRequired)

/**
 * 地域化三餐推荐模块路由（v1.1）
 */
router.get('/region-recommendation/today', getTodayRegionRecommendationHandler)
router.post('/user/region', reportUserRegionHandler)
// [测试用] 手动触发一次批量生成，跳过 03:00 定时等待，上线前应移除
router.post('/region-recommendation/run-now', runRegionRecommendationNowHandler)

export default router
