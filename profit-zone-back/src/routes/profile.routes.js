import { Router } from 'express'
import { requireAuth } from '../middlewares/requireAuth.js'
import { deleteProfile, getProfile, putProfile, putProfilePassword } from '../controllers/profile.controller.js'

const router = Router()

router.get('/', requireAuth, getProfile)
router.put('/', requireAuth, putProfile)
router.put('/password', requireAuth, putProfilePassword)
router.delete('/', requireAuth, deleteProfile)

export default router
