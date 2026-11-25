import { Router } from 'express'
import { adminAuthRequired } from '../../middlewares/adminAuth'
import { listHandler, detailHandler, cancelHandler } from '../../controllers/admin/orderController'

const router = Router()

router.use(adminAuthRequired)

router.get('/', listHandler)
router.get('/:id', detailHandler)
router.post('/:id/cancel', cancelHandler)

export default router
