/**
 * 统一 AI 大模型调用封装（v1.1 地域化三餐推荐）
 * 厂商/SDK 待确认，当前按 OpenAI 兼容 Chat Completions 协议占位实现，
 * 后续替换具体厂商时只需调整本文件，不影响上层业务逻辑
 */
import { config } from '../config'
import type { AiMealPlanResult } from '../types/api'

function buildPrompt(regionName: string, season: string): string {
    return `你是一个餐饮推荐助手。请根据地域「${regionName}」和当前季节「${season}」，结合本地特色菜与近期网红菜趋势，生成今日早、中、晚三餐推荐菜单。
要求：
1. 早餐 2-3 道，午餐 1-2 道，晚餐 1-2 道
2. 每道菜包含菜名（dishName）和一句话描述（description，说明做法特点/地域特色/推荐理由）
3. 严格以如下 JSON 格式输出，不要输出任何多余文字：
{"breakfast":[{"dishName":"","description":""}],"lunch":[{"dishName":"","description":""}],"dinner":[{"dishName":"","description":""}]}`
}

function parseMealPlan(raw: string): AiMealPlanResult {
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('AI 返回内容不包含合法 JSON')

    const parsed = JSON.parse(match[0])
    const meals = ['breakfast', 'lunch', 'dinner'] as const
    for (const meal of meals) {
        if (!Array.isArray(parsed[meal])) throw new Error(`AI 返回缺少 ${meal} 字段`)
    }
    return parsed as AiMealPlanResult
}

/**
 * 调用 AI 生成指定地域+季节的早中晚三餐推荐
 * 超时/网络异常/返回格式不合法均抛出异常，由调用方写入 status=failed，不做兜底
 */
export async function generateRegionMealPlan(regionName: string, season: string): Promise<AiMealPlanResult> {
    if (!config.ai.apiUrl || !config.ai.apiKey) {
        console.error('[aiService] 配置缺失，终止请求')
        throw new Error('AI 调用配置缺失（AI_API_URL/AI_API_KEY）')
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), config.ai.timeoutMs)

    try {
        const prompt = buildPrompt(regionName, season)

        const response = await fetch(config.ai.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${config.ai.apiKey}`
            },
            body: JSON.stringify({
                model: config.ai.model,
                input: prompt,
                temperature: 0.8,
                stream: false
            }),
            signal: controller.signal
        })

        if (!response.ok) {
            const errText = await response.text().catch(() => '')
            console.error(`[aiService] HTTP 非 2xx，响应体=${errText}`)
            throw new Error(`AI 调用失败，HTTP ${response.status}`)
        }

        const body = await response.json() as {
            output_text?: string
            output?: Array<{ type?: string; content?: Array<{ text?: string }> }>
        }

        const messageItem = body?.output?.find(item => item.type === 'message')
        const content = body?.output_text ?? messageItem?.content?.[0]?.text
        if (!content || typeof content !== 'string') {
            console.error(`[aiService] 响应结构不符合预期，body=${JSON.stringify(body)}`)
            throw new Error('AI 返回结构不符合预期')
        }

        return parseMealPlan(content)
    } catch (err) {
        console.error('[aiService] 请求过程中抛出异常:', err)
        throw err
    } finally {
        clearTimeout(timer)
    }
}
