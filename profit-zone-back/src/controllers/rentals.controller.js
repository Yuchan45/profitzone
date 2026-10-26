import { getRentalsInRadius } from '../services/rentals.service.js'

// Mismo rango que el radio de un análisis: más grande devolvería medio dataset
const MIN_RADIUS = 100
const MAX_RADIUS = 2000

export async function getRentals(req, res) {
  const { lat, lng, radius } = req.query

  if (lat === undefined || lat === '' || lng === undefined || lng === '') {
    const error = new Error('Los parámetros de consulta "lat" y "lng" son obligatorios.')
    error.status = 400
    throw error
  }

  const parsedLat = Number(lat)
  const parsedLng = Number(lng)

  if (Number.isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
    const error = new Error('El parámetro "lat" debe ser una latitud válida entre -90 y 90.')
    error.status = 400
    throw error
  }

  if (Number.isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) {
    const error = new Error('El parámetro "lng" debe ser una longitud válida entre -180 y 180.')
    error.status = 400
    throw error
  }

  const parsedRadius = radius !== undefined && radius !== '' ? Number(radius) : 1000

  if (!Number.isInteger(parsedRadius) || parsedRadius < MIN_RADIUS || parsedRadius > MAX_RADIUS) {
    const error = new Error(
      `El parámetro "radius" debe ser un número entero en metros entre ${MIN_RADIUS} y ${MAX_RADIUS}.`,
    )
    error.status = 400
    throw error
  }

  // El endpoint es público: devuelve solo las estadísticas, sin el listado de
  // avisos (direcciones y links de ZonaProp)
  const { places, ...stats } = await getRentalsInRadius({
    lat: parsedLat,
    lng: parsedLng,
    radiusInMeters: parsedRadius,
  })

  res.json(stats)
}
