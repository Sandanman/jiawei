import { Router } from 'express'
import { adminAuthRequired } from '../../middlewares/adminAuth'
import { loginHandler, meHandler, changePasswordHandler } from '../../controllers/admin/authController'

const router = Router()

router.post('/login', loginHandler)
router.get('/me', adminAuthRequired, meHandler)
router.put('/password', adminAuthRequired, changePasswordHandler)

export default router
