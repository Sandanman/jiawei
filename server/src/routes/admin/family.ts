import { Router } from 'express'
import { adminAuthRequired } from '../../middlewares/adminAuth'
import {
    listHandler,
    detailHandler,
    updateHandler,
    closeImpactHandler,
    closeHandler,
    restoreHandler
} from '../../controllers/admin/familyController'

const router = Router()

router.use(adminAuthRequired)

router.get('/', listHandler)
router.get('/:id', detailHandler)
router.put('/:id', updateHandler)
router.get('/:id/close-impact', closeImpactHandler)
router.post('/:id/close', closeHandler)
router.post('/:id/restore', restoreHandler)

export default router
