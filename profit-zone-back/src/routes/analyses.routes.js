import { Router } from 'express'
import { requireAuth } from '../middlewares/requireAuth.js'
import { optionalAuth } from '../middlewares/optionalAuth.js'
import {
  getAnalysisById,
  getAnalysisReport,
  postAnalysis,
  putAnalysisAnswers,
  patchAnalysisLocation,
} from '../controllers/analyses.controller.js'

const router = Router()

// Los pasos 1 y 2 se hacen sin sesión; "Analizar zona" (la ubicación) la exige
// y deja el análisis a nombre del usuario. Un análisis con dueño solo lo ve él.
router.post('/', optionalAuth, postAnalysis)
router.get('/:id', optionalAuth, getAnalysisById)
router.get('/:id/report', optionalAuth, getAnalysisReport)
router.put('/:id/answers', optionalAuth, putAnalysisAnswers)
router.patch('/:id/location', requireAuth, patchAnalysisLocation)

export default router
