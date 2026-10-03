import { Router } from 'express'
import { getDensity } from '../controllers/density.controller.js'

const router = Router()

router.get('/', getDensity)

export default router

