import { Router } from 'express'
import { requireAuth } from '../middlewares/requireAuth.js'
import { getAccessibility } from '../controllers/accessibility.controller.js'

const router = Router()

// Datos de OpenStreetMap en nuestra base (gratis); con sesión, como el resto del reporte
router.get('/', requireAuth, getAccessibility)

export default router

