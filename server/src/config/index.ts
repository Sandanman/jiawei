import dotenv from 'dotenv'
import type { PoolOptions } from 'mysql2/promise'

dotenv.config()

interface AppConfig {
    port: number
    nodeEnv: string
    isDev: boolean
    isProd: boolean
}

interface DbConfig {
    host: string
    port: number
    user: string
    password: string
    database: string
}

interface JwtConfig {
    secret: string
    expiresIn: string
}

interface AiConfig {
    apiUrl: string
    apiKey: string
    model: string
    timeoutMs: number
}

interface MapConfig {
    tencentKey: string
    timeoutMs: number
}

interface AdminJwtConfig {
    secret: string
    expiresIn: string
    /** 过期秒数，供登录响应 expiresIn 字段使用 */
    expiresInSeconds: number
}

interface AdminCorsConfig {
    origins: string[]
}

interface Config {
    app: AppConfig
    db: DbConfig
    jwt: JwtConfig
    dbPool: PoolOptions
    ai: AiConfig
    map: MapConfig
    adminJwt: AdminJwtConfig
    adminCors: AdminCorsConfig
}

const env = process.env

/** 解析逗号分隔的 origin 列表 */
function parseOrigins(raw: string | undefined, fallback: string[]): string[] {
    const list = (raw || '')
        .split(',')
        .map(item => item.trim())
        .filter(Boolean)
    return list.length > 0 ? list : fallback
}

/** 解析 jwt expiresIn 字符串（如 8h）为秒数，无法识别时默认 8 小时 */
function parseDurationSeconds(value: string): number {
    const matched = value.trim().match(/^(\d+)([smhd])$/i)
    if (!matched) return 8 * 3600
    const amount = Number(matched[1])
    const unit = matched[2].toLowerCase()
    const factor = unit === 's' ? 1 : unit === 'm' ? 60 : unit === 'h' ? 3600 : 86400
    return amount * factor
}

const adminJwtSecret = env.ADMIN_JWT_SECRET || ''
// 生产环境必须显式配置独立的管理端 JWT 密钥，不使用默认值
if (env.NODE_ENV === 'production' && !adminJwtSecret) {
    throw new Error('[CONFIG] 生产环境必须配置 ADMIN_JWT_SECRET')
}

export const config: Config = {
    app: {
        port: Number(env.PORT) || 3000,
        nodeEnv: env.NODE_ENV || 'development',
        isDev: env.NODE_ENV !== 'production',
        isProd: env.NODE_ENV === 'production'
    },
    db: {
        host: env.DB_HOST || 'localhost',
        port: Number(env.DB_PORT) || 3306,
        user: env.DB_USER || 'root',
        password: env.DB_PASSWORD || '',
        database: env.DB_NAME || 'jiawei'
    },
    jwt: {
        secret: env.JWT_SECRET || 'dev_secret_change_me',
        expiresIn: env.JWT_EXPIRES_IN || '7d'
    },
    ai: {
        apiUrl: env.AI_API_URL || '',
        apiKey: env.AI_API_KEY || '',
        model: env.AI_MODEL || '',
        timeoutMs: Number(env.AI_TIMEOUT_MS) || 10000
    },
    map: {
        tencentKey: env.TENCENT_MAP_KEY || '',
        timeoutMs: Number(env.MAP_TIMEOUT_MS) || 5000
    },
    adminJwt: {
        // 开发环境允许使用占位密钥，生产环境已在上面强制校验
        secret: adminJwtSecret || 'dev_admin_secret_change_me',
        expiresIn: env.ADMIN_JWT_EXPIRES_IN || '8h',
        expiresInSeconds: parseDurationSeconds(env.ADMIN_JWT_EXPIRES_IN || '8h')
    },
    adminCors: {
        origins: parseOrigins(env.ADMIN_CORS_ORIGINS, ['http://localhost:5173'])
    },
    dbPool: {
        host: env.DB_HOST || 'localhost',
        port: Number(env.DB_PORT) || 3306,
        user: env.DB_USER || 'root',
        password: env.DB_PASSWORD || '',
        database: env.DB_NAME || 'jiawei',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        charset: 'utf8mb4',
        timezone: '+08:00'
    }
}
