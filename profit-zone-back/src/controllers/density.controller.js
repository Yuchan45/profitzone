import { getDensityInRadius } from '../services/density.service.js'
import { parseLocationQuery } from '../utils/query.js'

export async function getDensity(req, res) {
  const { lat, lng, radiusInMeters } = parseLocationQuery(req.query, { defaultRadius: 500 })
  res.json(await getDensityInRadius({ lat, lng, radiusInMeters }))
}
