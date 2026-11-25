import { Router } from 'express'
import { adminAuthRequired } from '../../middlewares/adminAuth'
import {
    listHandler,
    detailHandler,
    disableHandler,
    enableHandler,
    resetPasswordHandler
} from '../../controllers/admin/userController'

const router = Router()

router.use(adminAuthRequired)

router.get('/', listHandler)
router.get('/:id', detailHandler)
router.post('/:id/disable', disableHandler)
router.post('/:id/enable', enableHandler)
router.post('/:id/reset-password', resetPasswordHandler)

export default router
