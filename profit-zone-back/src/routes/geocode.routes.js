import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import { getGeocode, getReverseGeocode } from '../controllers/geocode.controller.js'

const router = Router()

// Protege Photon y USIG ante ráfagas automáticas permitiendo autocompletado fluido
const geocodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { status: 'error', message: 'Demasiadas búsquedas de direcciones. Probá de nuevo en unos minutos.' },
})

router.get('/', geocodeLimiter, getGeocode)
router.get('/reverse', geocodeLimiter, getReverseGeocode)

export default router
