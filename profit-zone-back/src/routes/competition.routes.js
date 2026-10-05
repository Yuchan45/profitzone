import { Router } from 'express'
import { getCompetition } from '../controllers/competition.controller.js'

const router = Router()

router.get('/', getCompetition)

export default router
