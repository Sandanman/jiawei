/**
 * 每日 03:00 地域化三餐推荐生成定时任务（v1.1）
 * 不引入额外依赖，使用 setTimeout 计算到下一个 03:00 的延迟后触发，
 * 执行完成后再用 setInterval 固定 24 小时周期重复
 */
import { runDailyRegionRecommendationJob } from '../services/regionRecommendationService'

const ONE_DAY_MS = 24 * 60 * 60 * 1000

function getDelayUntilNext3AM(): number {
    const now = new Date()
    const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 3, 0, 0, 0)
    if (next.getTime() <= now.getTime()) {
        next.setDate(next.getDate() + 1)
    }
    return next.getTime() - now.getTime()
}

async function runJobSafely(): Promise<void> {
    try {
        await runDailyRegionRecommendationJob()
    } catch (err) {
        console.error('[regionRecommendationCron] 定时任务执行异常:', err)
    }
}

/**
 * 启动定时任务：首次对齐到下一个 03:00，之后每 24 小时执行一次
 */
export function startRegionRecommendationCron(): void {
    const delay = getDelayUntilNext3AM()
    console.log(`[regionRecommendationCron] 已注册，下次执行于 ${new Date(Date.now() + delay).toLocaleString()}`)

    setTimeout(() => {
        void runJobSafely()
        setInterval(() => {
            void runJobSafely()
        }, ONE_DAY_MS)
    }, delay)
}
