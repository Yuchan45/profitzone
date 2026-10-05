import { httpError } from '../utils/httpErrors.js'

// Normalizador de direcciones del Gobierno de la Ciudad (USIG): gratis y sin clave
const USIG_URL = 'https://servicios.usig.buenosaires.gob.ar/normalizar/'
const TIMEOUT_MS = 5000
const MAX_RESULTS = 5

// USIG devuelve las calles en mayúsculas ("GURRUCHAGA 1600")
function toTitleCase(text) {
  return text.toLocaleLowerCase('es').replace(/(^|[\s.(])(\p{L})/gu, (_, sep, letter) => sep + letter.toLocaleUpperCase('es'))
}

/**
 * Busca direcciones de CABA y devuelve las que tienen coordenadas:
 * [{ label, lat, lng }]. Una calle sin altura no tiene punto, así que se avisa.
 */
export async function searchAddresses(query) {
  const url = new URL(USIG_URL)
  url.search = new URLSearchParams({
    direccion: query,
    geocodificar: 'TRUE',
    srid: '4326',
    maxOptions: String(MAX_RESULTS * 2),
  })

  let body
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) })
    if (!response.ok) throw new Error(`USIG respondió ${response.status}`)
    body = await response.json()
  } catch (error) {
    console.warn(`[ProfitZone] No se pudo consultar el normalizador de direcciones: ${error.message}`)
    throw httpError(502, 'No pudimos buscar la dirección. Probá de nuevo en un rato.')
  }

  // Solo la Ciudad: el normalizador también devuelve direcciones del conurbano
  const inCaba = (body.direccionesNormalizadas ?? []).filter((d) => d.nombre_localidad === 'CABA')
  const withPoint = inCaba.filter((d) => d.coordenadas)

  if (inCaba.length > 0 && withPoint.length === 0) {
    throw httpError(422, 'Agregá la altura de la calle (por ejemplo, "Gurruchaga 1600").')
  }

  return withPoint.slice(0, MAX_RESULTS).map((d) => ({
    label: toTitleCase(d.direccion.replace(/, CABA$/, '')),
    lat: Number(d.coordenadas.y),
    lng: Number(d.coordenadas.x),
  }))
}
