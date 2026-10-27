import { Router } from 'express'
import { getSampleReport } from '../controllers/sampleReport.controller.js'

const router = Router()

// Público: lo muestra la home sin sesión y no consulta servicios pagos
router.get('/', getSampleReport)

export default router
