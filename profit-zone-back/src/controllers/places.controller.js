import { findNearbyPlaces, getPlace } from '../services/places.service.js'
import { httpError } from '../utils/httpErrors.js'

// Rango del radio de la vista previa (el paso 3 permite de 100 m a 2 km)
const RADIUS_MIN_M = 100
const RADIUS_MAX_M = 2000

function parseNumber(value, name, min, max) {
  const number = Number(value)
  if (typeof value !== 'string' || value.trim() === '' || Number.isNaN(number) || number < min || number > max) {
    throw httpError(400, `El parámetro "${name}" debe ser un número entre ${min} y ${max}.`)
  }
  return number
}

function parseCode(value, name) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw httpError(400, `El parámetro "${name}" es obligatorio.`)
  }
  return value.trim()
}

export async function getNearbyPlaces(req, res) {
  const { lat, lng, radius, category, subcategory, match } = req.query
  const rawRadius = typeof radius === 'string' ? radius.trim() : ''
  const parsedRadius = parseNumber(rawRadius, 'radius', RADIUS_MIN_M, RADIUS_MAX_M)
  if (!Number.isInteger(parsedRadius)) {
    throw httpError(400, `El parámetro "radius" debe ser un número entero entre ${RADIUS_MIN_M} y ${RADIUS_MAX_M}.`)
  }

  let parsedMatch = null
  if (match !== undefined && match !== '') {
    if (typeof match !== 'string' || !match.includes(':')) {
      throw httpError(400, 'El parámetro "match" debe tener el formato "pregunta:opción".')
    }
    parsedMatch = match.trim()
  }

  res.json(
    await findNearbyPlaces({
      lat: parseNumber(lat, 'lat', -90, 90),
      lng: parseNumber(lng, 'lng', -180, 180),
      radius: parsedRadius,
      categoryCode: parseCode(category, 'category'),
      subcategoryCode: parseCode(subcategory, 'subcategory'),
      match: parsedMatch,
    }),
  )
}

export async function getPlaceById(req, res) {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id <= 0) throw httpError(404, 'No encontramos ese negocio.')
  res.json(await getPlace(id))
}
