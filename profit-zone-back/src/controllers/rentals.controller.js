import { getRentalsInRadius } from '../services/rentals.service.js'
import { parseLocationQuery } from '../utils/query.js'

// Mismo rango que el radio de un análisis: más grande devolvería medio dataset
const MIN_RADIUS = 100
const MAX_RADIUS = 2000

export async function getRentals(req, res) {
  const { lat, lng, radiusInMeters } = parseLocationQuery(req.query, {
    defaultRadius: 1000,
    minRadius: MIN_RADIUS,
    maxRadius: MAX_RADIUS,
  })

  // El endpoint es público: devuelve solo las estadísticas, sin el listado de
  // avisos (direcciones y links de ZonaProp)
  const { places, ...stats } = await getRentalsInRadius({
    lat,
    lng,
    radiusInMeters,
  })

  res.json(stats)
}
