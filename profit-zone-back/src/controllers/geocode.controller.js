import { suggestLocations } from '../services/geocode.service.js'
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
