import { Router } from 'express'
import { requireAuth } from '../middlewares/requireAuth.js'
import {
  getAnalysisById,
  getAnalysisReport,
  postAnalysis,
  putAnalysisAnswers,
  patchAnalysisLocation,
} from '../controllers/analyses.controller.js'

const router = Router()

// Todo requiere sesión: sin cuenta, el flujo (pasos 1 a 3) vive solo en el front y
// el análisis se crea recién al registrarse o iniciar sesión. Cada análisis solo lo ve su dueño.
router.post('/', requireAuth, postAnalysis)
router.get('/:id', requireAuth, getAnalysisById)
router.get('/:id/report', requireAuth, getAnalysisReport)
router.put('/:id/answers', requireAuth, putAnalysisAnswers)
router.patch('/:id/location', requireAuth, patchAnalysisLocation)

export default router
