import { Router } from 'express'
import { getNeighborhoods } from '../controllers/neighborhoods.controller.js'

const router = Router()

router.get('/', getNeighborhoods)

export default router
