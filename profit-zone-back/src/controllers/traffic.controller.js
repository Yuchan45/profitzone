import { getTrafficAnalysis } from '../services/traffic.service.js'
import { httpError } from '../utils/httpErrors.js'
import { parseLocationQuery } from '../utils/query.js'

function parseHour(value) {
  const trimmed = typeof value === 'string' ? value.trim() : ''
  const parsed = Number(trimmed)
  if (!trimmed || !Number.isInteger(parsed) || parsed < 0 || parsed > 23) {
    throw httpError(400, 'Los parámetros "startHour" y "endHour" deben ser enteros entre 0 y 23.')
  }
  return parsed
}

export async function getTraffic(req, res) {
  const { lat, lng, radiusInMeters } = parseLocationQuery(req.query, { defaultRadius: 1000 })
  const { subcategory, schedule, startHour, endHour } = req.query

  const hasStart = startHour !== undefined && startHour !== ''
  const hasEnd = endHour !== undefined && endHour !== ''
  if (hasStart !== hasEnd) {
    throw httpError(400, 'Si especificás un rango horario, tenés que indicar "startHour" y "endHour".')
  }

  let sHour
  let eHour
  if (hasStart && hasEnd) {
    sHour = parseHour(startHour)
    eHour = parseHour(endHour)
    if (sHour > eHour) {
      throw httpError(400, 'El parámetro "startHour" no puede ser mayor que "endHour".')
    }
  }

  const result = await getTrafficAnalysis({
    lat,
    lng,
    radiusInMeters,
    subcategory: typeof subcategory === 'string' && subcategory.trim() ? subcategory.trim() : 'restaurante',
    schedule: typeof schedule === 'string' && schedule.trim() ? schedule.trim() : 'morning',
    startHour: sHour,
    endHour: eHour,
  })

  res.json(result)
}
