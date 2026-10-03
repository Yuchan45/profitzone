import { Router } from 'express'
import healthRoutes from './health.routes.js'
import densityRoutes from './density.routes.js'

const router = Router()

router.use('/health', healthRoutes)
router.use('/density', densityRoutes)

export default router

