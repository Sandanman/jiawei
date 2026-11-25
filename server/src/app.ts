import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'

import { config } from './config'
import { testConnection } from './db'
import { responseEnhance } from './middlewares/response'
import { errorHandler, notFound } from './middlewares/errorHandler'
import healthRouter from './routes/health'
import apiRouter from './routes'
import authRouter from './routes/auth'
import familyRouter from './routes/family'
import dishRouter from './routes/dish'
import orderRouter from './routes/order'
import pointsRouter from './routes/points'
import taskRouter from './routes/task'
import rewardRouter from './routes/reward'
import regionRecommendationRouter from './routes/regionRecommendation'
import adminRouter from './routes/admin'
import { adminError } from './middlewares/adminError'
import { startRegionRecommendationCron } from './jobs/regionRecommendationCron'

const app = express()

// ===== 基础中间件 =====
app.use(helmet())
// 全局 CORS：业务端放开 *；/api/admin 交给下面的独立白名单处理
const globalCors = cors({
    origin: '*', // 开发阶段允许所有来源，生产环境需配置白名单
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
})
app.use((req, res, next) => {
    if (req.path.startsWith('/api/admin')) {
        next()
        return
    }
    globalCors(req, res, next)
})
// 管理后台独立 CORS 白名单（ADMIN_CORS_ORIGINS）
const adminCors = cors({
    origin: (origin, callback) => {
        // 无 Origin（同源/服务端调用）直接放行
        if (!origin || config.adminCors.origins.includes(origin)) {
            callback(null, true)
            return
        }
        callback(null, false)
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
})
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan(config.app.isDev ? 'dev' : 'combined'))
app.use(responseEnhance)

// ===== 路由 =====
app.use('/api/health', healthRouter)
app.use('/api', apiRouter)
app.use('/api/auth', authRouter)
app.use('/api/family', familyRouter)
app.use('/api/dish', dishRouter)
app.use('/api/order', orderRouter)
app.use('/api/points', pointsRouter)
app.use('/api/task', taskRouter)
app.use('/api/reward', rewardRouter)
app.use('/api/v1', regionRecommendationRouter)
app.use('/api/admin', adminCors, adminRouter, adminError)

// ===== 错误处理 =====
app.use(notFound)
app.use(errorHandler)

// ===== 启动 =====
async function bootstrap(): Promise<void> {
    try {
        await testConnection()
        startRegionRecommendationCron()

        app.listen(config.app.port, () => {
            console.log('========================================')
            console.log(`  jiawei-server 启动成功`)
            console.log(`  环境: ${config.app.nodeEnv}`)
            console.log(`  地址: http://localhost:${config.app.port}`)
            console.log(`  健康检查: http://localhost:${config.app.port}/api/health`)
            console.log('========================================')
        })
    } catch (err) {
        console.error('[BOOTSTRAP] 启动失败:', err)
        process.exit(1)
    }
}

bootstrap()

export default app
