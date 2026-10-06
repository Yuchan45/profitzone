import { Router } from 'express'
import healthRoutes from './health.routes.js'
import densityRoutes from './density.routes.js'
import competitionRoutes from './competition.routes.js'
import trafficRoutes from './traffic.routes.js'
import categoriesRoutes from './categories.routes.js'
import questionsRoutes from './questions.routes.js'
import analysesRoutes from './analyses.routes.js'
import neighborhoodsRoutes from './neighborhoods.routes.js'
import geocodeRoutes from './geocode.routes.js'
import authRoutes from './auth.routes.js'
import rentalsRoutes from './rentals.routes.js'

const router = Router()

router.use('/health', healthRoutes)
router.use('/density', densityRoutes)
router.use('/competition', competitionRoutes)
router.use('/traffic', trafficRoutes)
router.use('/categories', categoriesRoutes)
router.use('/questions', questionsRoutes)
router.use('/analyses', analysesRoutes)
router.use('/neighborhoods', neighborhoodsRoutes)
router.use('/geocode', geocodeRoutes)
router.use('/auth', authRoutes)
router.use('/rentals', rentalsRoutes)

export default router
