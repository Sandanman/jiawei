/**
 * 地图服务（腾讯位置服务）：逆地理编码 + IP 定位
 * 只在服务端调用，Key 来自环境变量 TENCENT_MAP_KEY，不下发前端
 * 所有结果统一规整为「市级 adcode + 展示名」，供 region_code 使用
 */
import { config } from '../config'
import { CITY_NAME_MAP } from '../data/cityList'

const TENCENT_BASE_URL = 'https://apis.map.qq.com'

// 省直辖县级行政区（济源/仙桃/潜江/天门/神农架/海南与新疆直辖县等），adcode 前 4 位固定，不能折算到「市」
const PROVINCE_DIRECT_PREFIXES = ['4190', '4290', '4690', '6590']

export interface GeoRegion {
    adcode: string
    regionName: string
}

interface TencentAdInfo {
    nation?: string
    province?: string
    city?: string
    district?: string
    adcode?: number | string
}

interface TencentResponse {
    status: number
    message?: string
    result?: {
        ad_info?: TencentAdInfo
    }
}

/**
 * 区县 adcode 折算为市级 adcode：440106 -> 440100；省直辖县级保持原值
 */
export function toCityAdcode(adcode: string): string {
    if (!/^\d{6}$/.test(adcode)) throw new Error('adcode 格式不正确')
    if (PROVINCE_DIRECT_PREFIXES.includes(adcode.slice(0, 4))) return adcode
    return `${adcode.slice(0, 4)}00`
}

/**
 * 按 adcode 解析展示名，仅信任服务端自带的行政区划表
 */
export function resolveCityName(adcode: string): string | null {
    return CITY_NAME_MAP[adcode] || null
}

/**
 * 规整客户端 IP：去掉 IPv4 映射前缀，并只放行公网 IPv4
 * 本地开发（127.0.0.1 / ::1）与内网地址无法定位，返回 null 由上层提示用户手动选城市
 */
export function normalizePublicIp(rawIp: string | undefined): string | null {
    if (!rawIp) return null
    const ip = rawIp.replace(/^::ffff:/, '')
    const match = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
    if (!match) return null

    const [a, b] = [Number(match[1]), Number(match[2])]
    const octets = match.slice(1).map(Number)
    if (octets.some(n => n > 255)) return null
    const isPrivate = a === 10 || a === 127 || a === 0
        || (a === 172 && b >= 16 && b <= 31)
        || (a === 192 && b === 168)
        || (a === 169 && b === 254)
    return isPrivate ? null : ip
}

async function requestTencent(path: string, params: Record<string, string>): Promise<TencentAdInfo> {
    if (!config.map.tencentKey) {
        console.error('[geoService] 配置缺失，终止请求')
        throw new Error('地图服务未配置（TENCENT_MAP_KEY）')
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), config.map.timeoutMs)

    try {
        const query = new URLSearchParams({ ...params, key: config.map.tencentKey })
        const response = await fetch(`${TENCENT_BASE_URL}${path}?${query.toString()}`, { signal: controller.signal })
        if (!response.ok) {
            throw new Error(`地图服务调用失败，HTTP ${response.status}`)
        }

        const body = await response.json() as TencentResponse
        if (body.status !== 0) {
            // 不输出 URL，避免 Key 进入日志
            console.error(`[geoService] 腾讯位置服务返回异常 path=${path} status=${body.status} message=${body.message}`)
            throw new Error(`地图服务返回异常（${body.status}）`)
        }

        const adInfo = body.result?.ad_info
        if (!adInfo || !adInfo.adcode) {
            throw new Error('地图服务未返回行政区划信息')
        }
        return adInfo
    } catch (err) {
        if ((err as Error).name === 'AbortError') {
            console.error(`[geoService] 请求超时 path=${path}`)
            throw new Error('地图服务请求超时')
        }
        throw err
    } finally {
        clearTimeout(timer)
    }
}

function toGeoRegion(adInfo: TencentAdInfo): GeoRegion {
    const adcode = toCityAdcode(String(adInfo.adcode))
    const regionName = resolveCityName(adcode) || `${adInfo.province || ''}${adInfo.city || ''}`.trim()
    if (!regionName) throw new Error('无法解析所在城市')
    return { adcode, regionName }
}

/**
 * 逆地理编码：经纬度 -> 市级 adcode + 展示名
 * 说明：uni.getLocation 返回 WGS84，腾讯接口按 GCJ-02 解析，偏移约几百米，对市级判定可忽略
 */
export async function reverseGeocode(latitude: number, longitude: number): Promise<GeoRegion> {
    const adInfo = await requestTencent('/ws/geocoder/v1/', { location: `${latitude},${longitude}` })
    return toGeoRegion(adInfo)
}

/**
 * IP 定位：公网 IP -> 市级 adcode + 展示名
 */
export async function locateByIp(ip: string): Promise<GeoRegion> {
    const adInfo = await requestTencent('/ws/location/v1/ip', { ip })
    return toGeoRegion(adInfo)
}
