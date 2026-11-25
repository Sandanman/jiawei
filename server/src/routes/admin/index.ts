import { Router } from 'express'
import authRouter from './auth'
import familyRouter from './family'
import dishRouter from './dish'
import userRouter from './user'
import orderRouter from './order'
import rewardOrderRouter from './rewardOrder'
import auditRouter from './audit'

const router = Router()

router.use('/auth', authRouter)
router.use('/families', familyRouter)
router.use('/dishes', dishRouter)
router.use('/users', userRouter)
router.use('/orders', orderRouter)
router.use('/reward-orders', rewardOrderRouter)
router.use('/audit-logs', auditRouter)

export default router
