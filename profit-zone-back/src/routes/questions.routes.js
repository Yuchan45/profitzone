import { Router } from 'express'
import { getQuestions, getQuestion } from '../controllers/questions.controller.js'

const router = Router()

router.get('/', getQuestions)
router.get('/:code', getQuestion)

export default router
