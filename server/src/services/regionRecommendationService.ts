/**
 * 地域化三餐推荐 Service（v1.1）
 * 按 region_code 分组批量生成，AI 失败不做兜底，仅标记 status=failed
 */
import { pool, query, queryOne, insert } from '../db'
import type { UserRow, DailyRegionRecommendationRow, DailyRegionRecommendationItemRow, MealType } from '../types/db'
import type { RegionRecommendationToday, RegionRecommendationMealItem } from '../types/api'
import { generateRegionMealPlan } from './aiService'
import { getCurrentSeason } from '../utils/season'

function todayDateStr(): string {
    const d = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/**
 * 查询当前存在的所有不同 region_code（来自用户上报的位置）
 */
export async function listDistinctRegionCodes(): Promise<string[]> {
    const rows = await query<Array<{ region_code: string }>>(
        `SELECT DISTINCT region_code FROM user WHERE region_code IS NOT NULL AND region_code != ''`
    )
    return rows.map(r => r.region_code)
}

/**
 * 对单个地域调用 AI 生成当日三餐推荐并写入缓存表
 * AI 失败时写入 status=failed，不生成 items，不做任何兜底
 */
export async function generateForRegion(regionCode: string): Promise<void> {
    const recommendDate = todayDateStr()
    const season = getCurrentSeason()

    const existed = await queryOne<DailyRegionRecommendationRow>(
        `SELECT * FROM daily_region_recommendation WHERE region_code = ? AND recommend_date = ?`,
        [regionCode, recommendDate]
    )
    if (existed && existed.status === 'success') return
    if (existed && existed.status === 'failed') {
        // 允许失败后重试：清除旧的失败记录（无明细可清）重新生成
        await pool.query(
            `DELETE FROM daily_region_recommendation WHERE region_code = ? AND recommend_date = ?`,
            [regionCode, recommendDate]
        )
    }

    const conn = await pool.getConnection()
    try {
        let recommendationId: number

        try {
            const plan = await generateRegionMealPlan(regionCode, season)

            await conn.beginTransaction()
            const [insertResult] = await conn.query(
                `INSERT INTO daily_region_recommendation (region_code, recommend_date, season, status, generated_at)
                 VALUES (?, ?, ?, 'success', NOW())`,
                [regionCode, recommendDate, season]
            )
            recommendationId = (insertResult as any).insertId

            const meals: Array<{ type: MealType; items: Array<{ dishName: string; description?: string }> }> = [
                { type: 'breakfast', items: plan.breakfast },
                { type: 'lunch', items: plan.lunch },
                { type: 'dinner', items: plan.dinner }
            ]

            for (const meal of meals) {
                let sortOrder = 0
                for (const item of meal.items) {
                    await conn.query(
                        `INSERT INTO daily_region_recommendation_item (recommendation_id, meal_type, dish_name, description, sort_order)
                         VALUES (?, ?, ?, ?, ?)`,
                        [recommendationId, meal.type, item.dishName, item.description || '', sortOrder++]
                    )
                }
            }

            await conn.commit()
        } catch (aiErr) {
            await conn.rollback()
            console.error(`[regionRecommendation] region=${regionCode} AI生成失败:`, aiErr)
            await insert(
                `INSERT INTO daily_region_recommendation (region_code, recommend_date, season, status, generated_at)
                 VALUES (?, ?, ?, 'failed', NOW())`,
                [regionCode, recommendDate, season]
            )
        }
    } finally {
        conn.release()
    }
}

/**
 * 每天 03:00 定时任务：遍历当前所有 region_code，逐个生成当日推荐
 */
export async function runDailyRegionRecommendationJob(): Promise<void> {
    const regionCodes = await listDistinctRegionCodes()
    console.log(`[regionRecommendation] 定时任务触发，共 ${regionCodes.length} 个地域`)

    for (const regionCode of regionCodes) {
        await generateForRegion(regionCode)
    }
}

/**
 * 查询当前登录用户所在地域当日三餐推荐
 */
export async function getTodayRecommendation(userId: number): Promise<RegionRecommendationToday | null> {
    const user = await queryOne<UserRow>(`SELECT * FROM user WHERE id = ? AND status = 1`, [userId])
    if (!user || !user.region_code) return null

    const recommendDate = todayDateStr()
    const recommendation = await queryOne<DailyRegionRecommendationRow>(
        `SELECT * FROM daily_region_recommendation WHERE region_code = ? AND recommend_date = ?`,
        [user.region_code, recommendDate]
    )

    const emptyMeals = { breakfast: [], lunch: [], dinner: [] }

    if (!recommendation || recommendation.status === 'failed') {
        return {
            regionCode: user.region_code,
            recommendDate,
            season: recommendation?.season || getCurrentSeason(),
            status: 'failed',
            meals: emptyMeals
        }
    }

    const items = await query<DailyRegionRecommendationItemRow[]>(
        `SELECT * FROM daily_region_recommendation_item WHERE recommendation_id = ? ORDER BY meal_type ASC, sort_order ASC`,
        [recommendation.id]
    )

    const toMealItem = (row: DailyRegionRecommendationItemRow): RegionRecommendationMealItem => ({
        dishName: row.dish_name,
        description: row.description
    })

    return {
        regionCode: user.region_code,
        recommendDate,
        season: recommendation.season,
        status: 'success',
        meals: {
            breakfast: items.filter(i => i.meal_type === 'breakfast').map(toMealItem),
            lunch: items.filter(i => i.meal_type === 'lunch').map(toMealItem),
            dinner: items.filter(i => i.meal_type === 'dinner').map(toMealItem)
        }
    }
}

/**
 * 用户上报位置，存储为 region_code
 * 前端传入 "纬度,经度" 原始坐标，这里四舍五入到 2 位小数（约 1.1km 精度）
 * 既能落在 region_code varchar(32) 范围内，又能让相近位置的用户共享同一份地域推荐
 */
export async function setUserRegion(userId: number, location: string): Promise<string> {
    const raw = location.trim()
    if (!raw) throw new Error('location 不能为空')

    const [latStr, lngStr] = raw.split(',').map(s => s.trim())
    const lat = Number(latStr)
    const lng = Number(lngStr)

    const regionCode = Number.isFinite(lat) && Number.isFinite(lng)
        ? `${lat.toFixed(2)},${lng.toFixed(2)}`
        : raw.slice(0, 32)

    await pool.query(`UPDATE user SET region_code = ? WHERE id = ?`, [regionCode, userId])
    return regionCode
}
