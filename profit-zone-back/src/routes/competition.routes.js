import { Router } from 'express'
import { requireAuth } from '../middlewares/requireAuth.js'
import { getCompetition } from '../controllers/competition.controller.js'

const router = Router()

// Consume Google Places (pago por consulta): solo con sesión
router.get('/', requireAuth, getCompetition)

export default router
