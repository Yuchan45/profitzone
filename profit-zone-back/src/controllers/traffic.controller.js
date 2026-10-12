import { getTrafficAnalysis } from '../services/traffic.service.js'

export async function getTraffic(req, res) {
  const { lat, lng, radius, subcategory, schedule, startHour, endHour } = req.query

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

  if (Number.isNaN(parsedRadius) || parsedRadius < 10 || parsedRadius > 20000) {
    const error = new Error('El parámetro "radius" debe ser un número en metros entre 10 y 20000.')
    error.status = 400
    throw error
  }

  let sHour = undefined
  let eHour = undefined
  if (startHour !== undefined && endHour !== undefined) {
    sHour = Number(startHour)
    eHour = Number(endHour)
    if (Number.isNaN(sHour) || Number.isNaN(eHour) || sHour < 0 || sHour > 23 || eHour < 0 || eHour > 23) {
      const error = new Error('Los parámetros "startHour" y "endHour" deben ser enteros entre 0 y 23.')
      error.status = 400
      throw error
    }
  }

  const result = await getTrafficAnalysis({
    lat: parsedLat,
    lng: parsedLng,
    radiusInMeters: parsedRadius,
    subcategory: subcategory || 'restaurante',
    schedule: schedule || 'morning',
    startHour: sHour,
    endHour: eHour,
  })

  res.json(result)
}
