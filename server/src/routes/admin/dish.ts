import { Router } from 'express'
import { adminAuthRequired } from '../../middlewares/adminAuth'
import {
    listHandler,
    detailHandler,
    updateHandler,
    publishHandler,
    deleteHandler
} from '../../controllers/admin/dishController'

const router = Router()

router.use(adminAuthRequired)

router.get('/', listHandler)
router.get('/:id', detailHandler)
router.put('/:id', updateHandler)
router.patch('/:id/publish', publishHandler)
router.post('/:id/delete', deleteHandler)

export default router
