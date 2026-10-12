import { Router } from 'express'
import { getNearbyPlaces } from '../controllers/places.controller.js'

const router = Router()

// Sin sesión: lee solo la base propia (datos de OSM), no consume APIs pagas
router.get('/nearby', getNearbyPlaces)

export default router
