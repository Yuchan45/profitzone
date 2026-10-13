import { Router } from 'express'
import { requireAuth } from '../middlewares/requireAuth.js'
import { getAccessibility } from '../controllers/accessibility.controller.js'

const router = Router()

// Consume Google Places (pago por consulta): solo con sesión
router.get('/', requireAuth, getAccessibility)

export default router

