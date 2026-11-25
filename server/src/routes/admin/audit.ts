import { Router } from 'express'
import { adminAuthRequired } from '../../middlewares/adminAuth'
import { listHandler, detailHandler } from '../../controllers/admin/auditController'

const router = Router()

router.use(adminAuthRequired)

router.get('/', listHandler)
router.get('/:id', detailHandler)

export default router
