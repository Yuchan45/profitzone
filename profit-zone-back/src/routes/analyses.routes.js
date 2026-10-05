import { Router } from 'express'
import {
  getAnalysisById,
  getAnalysisReport,
  postAnalysis,
  putAnalysisAnswers,
  patchAnalysisLocation,
} from '../controllers/analyses.controller.js'

const router = Router()

router.post('/', postAnalysis)
router.get('/:id', getAnalysisById)
router.get('/:id/report', getAnalysisReport)
router.put('/:id/answers', putAnalysisAnswers)
router.patch('/:id/location', patchAnalysisLocation)

export default router
