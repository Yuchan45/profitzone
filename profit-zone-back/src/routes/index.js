import { Router } from 'express'
import healthRoutes from './health.routes.js'
import densityRoutes from './density.routes.js'
import competitionRoutes from './competition.routes.js'
import trafficRoutes from './traffic.routes.js'

const router = Router()

router.use('/health', healthRoutes)
router.use('/density', densityRoutes)
router.use('/competition', competitionRoutes)
router.use('/traffic', trafficRoutes)

export default router
