import { reverseGeocode, suggestLocations } from '../services/geocode.service.js'
import { httpError } from '../utils/httpErrors.js'

const MIN_QUERY_LENGTH = 3
const MAX_QUERY_LENGTH = 120

export async function getGeocode(req, res) {
  const query = typeof req.query.q === 'string' ? req.query.q.trim() : ''
  if (query.length < MIN_QUERY_LENGTH || query.length > MAX_QUERY_LENGTH) {
    throw httpError(400, `Escribí una dirección de entre ${MIN_QUERY_LENGTH} y ${MAX_QUERY_LENGTH} caracteres.`)
  }
  res.json(await suggestLocations(query))
}

function parseCoordinate(value, name, limit) {
  const number = Number(value)
  if (typeof value !== 'string' || value.trim() === '' || Number.isNaN(number) || Math.abs(number) > limit) {
    throw httpError(400, `El parámetro "${name}" debe ser un número entre -${limit} y ${limit}.`)
  }
  return number
}

export async function getReverseGeocode(req, res) {
  res.json(
    await reverseGeocode({
      lat: parseCoordinate(req.query.lat, 'lat', 90),
      lng: parseCoordinate(req.query.lng, 'lng', 180),
    }),
  )
}
