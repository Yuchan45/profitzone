import { httpError } from './httpErrors.js'

/**
 * Convierte un query param booleano ('true' / 'false') a boolean.
 * Devuelve undefined si no vino, y lanza un 400 si trae otro valor.
 */
export function parseBooleanQuery(value, name) {
  if (value === undefined || value === '') return undefined
  if (value === 'true') return true
  if (value === 'false') return false

  throw httpError(400, `El parámetro "${name}" debe ser "true" o "false".`)
}

function parseCoordinate(value, name, limit) {
  const trimmed = typeof value === 'string' ? value.trim() : ''
  const parsed = Number(trimmed)
  if (!trimmed || Number.isNaN(parsed) || parsed < -limit || parsed > limit) {
    throw httpError(
      400,
      name === 'lat'
        ? 'El parámetro "lat" debe ser una latitud válida entre -90 y 90.'
        : 'El parámetro "lng" debe ser una longitud válida entre -180 y 180.',
    )
  }
  return parsed
}

/**
 * Valida los parámetros de consulta `lat`, `lng` y `radius` de los endpoints geográficos.
 */
export function parseLocationQuery(
  { lat, lng, radius },
  { defaultRadius = 1000, minRadius = 10, maxRadius = 20000 } = {},
) {
  if (typeof lat !== 'string' || lat.trim() === '' || typeof lng !== 'string' || lng.trim() === '') {
    throw httpError(400, 'Los parámetros de consulta "lat" y "lng" son obligatorios.')
  }

  const parsedLat = parseCoordinate(lat, 'lat', 90)
  const parsedLng = parseCoordinate(lng, 'lng', 180)

  const rawRadius = typeof radius === 'string' ? radius.trim() : ''
  const parsedRadius = rawRadius !== '' ? Number(rawRadius) : defaultRadius

  if (!Number.isInteger(parsedRadius) || parsedRadius < minRadius || parsedRadius > maxRadius) {
    throw httpError(
      400,
      `El parámetro "radius" debe ser un número entero en metros entre ${minRadius} y ${maxRadius}.`,
    )
  }

  return { lat: parsedLat, lng: parsedLng, radiusInMeters: parsedRadius }
}
