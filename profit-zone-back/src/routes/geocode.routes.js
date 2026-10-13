import { Router } from 'express'
import { getGeocode, getReverseGeocode } from '../controllers/geocode.controller.js'

const router = Router()

router.get('/', getGeocode)
router.get('/reverse', getReverseGeocode)

export default router
