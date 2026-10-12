import { Router } from 'express'
import { getGeocode } from '../controllers/geocode.controller.js'

const router = Router()

router.get('/', getGeocode)

export default router
