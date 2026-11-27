import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import { requireAuth } from '../middlewares/requireAuth.js'
import { getCompetition } from '../controllers/competition.controller.js'

const router = Router()

const competitionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { status: 'error', message: 'Demasiadas consultas de competencia. Probá de nuevo en unos minutos.' },
})

// Consume Google Places (pago por consulta): solo con sesión y límite por ventana
router.get('/', requireAuth, competitionLimiter, getCompetition)

export default router
