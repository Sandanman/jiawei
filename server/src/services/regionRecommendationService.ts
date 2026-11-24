/**
 * 地域化三餐推荐 Service（v1.1）
 * 按 region_code（市级 adcode）分组批量生成，AI 失败不做兜底，仅标记 status=failed
 */
import { pool, query, queryOne, insert } from '../db'
import type { UserRow, DailyRegionMealRow, MealType } from '../types/db'
import type { RegionRecommendationToday, RegionRecommendationMealItem, UserRegionResult } from '../types/api'
import { generateRegionMealPlan } from './aiService'
import { reverseGeocode, locateByIp, resolveCityName } from './geoService'
import { getCurrentSeason } from '../utils/season'

function todayDateStr(): string {
    const d = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/**
 * 查询当前存在的所有地域（region_code + 展示名），来自用户上报/定位结果
 * 旧版经纬度格式的 region_code 没有 region_name，会被自然过滤掉
 */
export async function listDistinctRegions(): Promise<Array<{ regionCode: string; regionName: string }>> {
    const rows = await query<Array<{ region_code: string; region_name: string }>>(
        `SELECT region_code, MAX(region_name) AS region_name FROM user
         WHERE region_code IS NOT NULL AND region_code != '' AND region_name IS NOT NULL AND region_name != ''
         GROUP BY region_code`
    )
    return rows.map(r => ({ regionCode: r.region_code, regionName: r.region_name }))
}

/**
 * 对单个地域调用 AI 生成当日三餐推荐并写入 daily_region_meal
 * AI 失败时仅写入 1 条 status=failed 的占位行（无真实菜品），不做任何兜底
 */
export async function generateForRegion(regionCode: string, regionName: string): Promise<void> {
    const recommendDate = todayDateStr()
    const season = getCurrentSeason()

    const existed = await queryOne<Pick<DailyRegionMealRow, 'status'>>(
        `SELECT status FROM daily_region_meal WHERE region_code = ? AND recommend_date = ? LIMIT 1`,
        [regionCode, recommendDate]
    )
    if (existed && existed.status === 'success') return
    if (existed && existed.status === 'failed') {
        // 允许失败后重试：清除旧的失败占位行后重新生成
        await pool.query(
            `DELETE FROM daily_region_meal WHERE region_code = ? AND recommend_date = ?`,
            [regionCode, recommendDate]
        )
    }

    const conn = await pool.getConnection()
    try {
        try {
            const plan = await generateRegionMealPlan(regionName, season)

            const meals: Array<{ type: MealType; items: Array<{ dishName: string; description?: string }> }> = [
                { type: 'breakfast', items: plan.breakfast },
                { type: 'lunch', items: plan.lunch },
                { type: 'dinner', items: plan.dinner }
            ]
            const rows = meals.flatMap(meal => meal.items.map((item, index) => [
                regionCode, recommendDate, meal.type, index, item.dishName, item.description || '', 'success'
            ]))
            if (rows.length === 0) throw new Error('AI 返回的推荐菜为空')

            await conn.beginTransaction()
            await conn.query(
                `INSERT INTO daily_region_meal (region_code, recommend_date, meal_type, sort_order, dish_name, description, status)
                 VALUES ?`,
                [rows]
            )
            await conn.commit()
        } catch (aiErr) {
            await conn.rollback()
            console.error(`[regionRecommendation] region=${regionCode}(${regionName}) AI生成失败:`, aiErr)
            // IGNORE：并发场景下若已有他处写入成功记录，则不覆盖
            await insert(
                `INSERT IGNORE INTO daily_region_meal (region_code, recommend_date, meal_type, sort_order, dish_name, description, status)
                 VALUES (?, ?, 'breakfast', 0, '', '', 'failed')`,
                [regionCode, recommendDate]
            )
        }
    } finally {
        conn.release()
    }
}

/**
 * 为当前登录用户所在地域生成当日推荐（切换城市后当日尚无记录 / 上次失败时由前端触发）
 * 已有成功记录时直接返回，失败时不抛错（由 getTodayRecommendation 体现 failed 状态）
 */
export async function generateForUserRegion(userId: number): Promise<void> {
    const user = await queryOne<UserRow>(`SELECT * FROM user WHERE id = ? AND status = 1`, [userId])
    if (!user || !user.region_code || !user.region_name) throw new Error('请先获取位置后再生成推荐')
    await generateForRegion(user.region_code, user.region_name)
}

/**
 * 每天 03:00 定时任务：遍历当前所有地域，逐个生成当日推荐
 */
export async function runDailyRegionRecommendationJob(): Promise<void> {
    const regions = await listDistinctRegions()
    console.log(`[regionRecommendation] 定时任务触发，共 ${regions.length} 个地域`)

    for (const region of regions) {
        await generateForRegion(region.regionCode, region.regionName)
    }
}

/**
 * 查询当前登录用户所在地域当日三餐推荐
 */
export async function getTodayRecommendation(userId: number): Promise<RegionRecommendationToday | null> {
    const user = await queryOne<UserRow>(`SELECT * FROM user WHERE id = ? AND status = 1`, [userId])
    if (!user || !user.region_code || !user.region_name) return null

    const recommendDate = todayDateStr()
    const season = getCurrentSeason()
    const rows = await query<DailyRegionMealRow[]>(
        `SELECT * FROM daily_region_meal WHERE region_code = ? AND recommend_date = ? ORDER BY meal_type ASC, sort_order ASC`,
        [user.region_code, recommendDate]
    )

    // 当日无记录或为失败占位行，均视为生成失败，前端据此展示「重试」
    if (rows.length === 0 || rows[0].status === 'failed') {
        return {
            regionCode: user.region_code,
            regionName: user.region_name,
            regionSource: user.region_source,
            recommendDate,
            season,
            status: 'failed',
            meals: { breakfast: [], lunch: [], dinner: [] }
        }
    }

    const toMealItem = (row: DailyRegionMealRow): RegionRecommendationMealItem => ({
        dishName: row.dish_name,
        description: row.description
    })

    return {
        regionCode: user.region_code,
        regionName: user.region_name,
        regionSource: user.region_source,
        recommendDate,
        season,
        status: 'success',
        meals: {
            breakfast: rows.filter(r => r.meal_type === 'breakfast').map(toMealItem),
            lunch: rows.filter(r => r.meal_type === 'lunch').map(toMealItem),
            dinner: rows.filter(r => r.meal_type === 'dinner').map(toMealItem)
        }
    }
}

export type SetUserRegionInput =
    | { source: 'gps'; latitude: number; longitude: number }
    | { source: 'ip'; ip: string }
    | { source: 'manual'; adcode: string }

/**
 * 设置用户所在地域，统一落库为「市级 adcode + 展示名 + 来源」
 * - gps：经纬度逆地理编码
 * - ip：IP 定位兜底（用户拒绝授权/定位失败时）
 * - manual：用户手动选城市，仅接受服务端行政区划表内的 adcode，名称以服务端为准
 */
export async function setUserRegion(userId: number, input: SetUserRegionInput): Promise<UserRegionResult> {
    let regionCode: string
    let regionName: string

    if (input.source === 'gps') {
        const geo = await reverseGeocode(input.latitude, input.longitude)
        regionCode = geo.adcode
        regionName = geo.regionName
    } else if (input.source === 'ip') {
        const geo = await locateByIp(input.ip)
        regionCode = geo.adcode
        regionName = geo.regionName
    } else {
        const name = resolveCityName(input.adcode)
        if (!name) throw new Error('不支持的城市')
        regionCode = input.adcode
        regionName = name
    }

    await pool.query(
        `UPDATE user SET region_code = ?, region_name = ?, region_source = ? WHERE id = ?`,
        [regionCode, regionName, input.source, userId]
    )
    return { regionCode, regionName, regionSource: input.source }
}
