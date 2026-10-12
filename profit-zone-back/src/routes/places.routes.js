import { Router } from 'express'
import { getNearbyPlaces, getPlaceById } from '../controllers/places.controller.js'

const router = Router()

// Sin sesión: lee solo la base propia (datos de OSM), no consume APIs pagas
router.get('/nearby', getNearbyPlaces)
router.get('/:id', getPlaceById)

export default router
