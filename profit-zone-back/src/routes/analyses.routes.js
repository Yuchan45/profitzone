import { Router } from 'express'
import {
  getAnalysisById,
  postAnalysis,
  putAnalysisAnswers,
  patchAnalysisLocation,
} from '../controllers/analyses.controller.js'

const router = Router()

router.post('/', postAnalysis)
router.get('/:id', getAnalysisById)
router.put('/:id/answers', putAnalysisAnswers)
router.patch('/:id/location', patchAnalysisLocation)

export default router
