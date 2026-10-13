import { listNeighborhoods } from './neighborhoods.service.js'
import { isPointInPolygons } from '../utils/geo.js'
import { httpError } from '../utils/httpErrors.js'

// Dos servicios gratis y sin clave, que se complementan:
// - Photon (OpenStreetMap) completa nombres de calles y lugares mientras se
//   escribe ("gurr" → Gurruchaga), pero casi no tiene alturas en Buenos Aires.
// - USIG (normalizador del GCBA) geolocaliza calle + altura exactas, pero
//   necesita el nombre de la calle completo.
const PHOTON_URL = 'https://photon.komoot.io/api/'
const PHOTON_REVERSE_URL = 'https://photon.komoot.io/reverse'
const USIG_URL = 'https://servicios.usig.buenosaires.gob.ar/normalizar/'
// Búsqueda inversa de USIG: devuelve la puerta más cercana a un punto de CABA
const USIG_REVERSE_URL = 'https://ws.usig.buenosaires.gob.ar/geocoder/2.2/reversegeocoding'
const TIMEOUT_MS = 4000
const MAX_SUGGESTIONS = 6
// Calles de Photon que se prueban con la altura escrita
const MAX_STREETS_FOR_ADDRESS = 2

// Las sugerencias de una misma búsqueda no cambian: se guardan para no repetir
// pedidos a los servicios externos mientras el usuario escribe y borra
const cache = new Map()
const CACHE_MAX_ENTRIES = 300

async function fetchText(url) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { 'user-agent': 'ProfitZone (proyecto UADE)' },
  })
  if (!response.ok) throw new Error(`respondió ${response.status}`)
  return response.text()
}

async function fetchJson(url) {
  return JSON.parse(await fetchText(url))
}

// USIG devuelve las calles en mayúsculas ("GURRUCHAGA 1600")
function toTitleCase(text) {
  return text
    .toLocaleLowerCase('es')
    .replace(/(^|[\s.(])(\p{L})/gu, (_, sep, letter) => sep + letter.toLocaleUpperCase('es'))
}

function normalize(text) {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

/** Busca en Photon dentro del rectángulo del barrio y devuelve los features. */
async function searchPhoton(query, bounds) {
  const url = new URL(PHOTON_URL)
  url.search = new URLSearchParams({
    q: query,
    bbox: [bounds.west, bounds.south, bounds.east, bounds.north].join(','),
    limit: '15',
  })
  const body = await fetchJson(url)
  return body.features ?? []
}

/** Geolocaliza "calle altura" con USIG: [{ label, lat, lng }] en CABA. */
async function geocodeWithUsig(address) {
  const url = new URL(USIG_URL)
  url.search = new URLSearchParams({ direccion: address, geocodificar: 'TRUE', srid: '4326', maxOptions: '5' })
  const body = await fetchJson(url)
  return (body.direccionesNormalizadas ?? [])
    .filter((d) => d.nombre_localidad === 'CABA' && d.coordenadas)
    .map((d) => ({
      label: toTitleCase(d.direccion.replace(/, CABA$/, '')),
      lat: Number(d.coordenadas.y),
      lng: Number(d.coordenadas.x),
    }))
}

// Alturas posibles para lo que se escribió: "16" puede ser 16, 160 o 1600
function candidateNumbers(number) {
  const value = Number(number)
  return [...new Set([value, value * 10, value * 100])].filter((n) => n > 0 && n <= 99999)
}

/** Calles (sin altura) y lugares de Photon que caen en el barrio. */
async function suggestStreetsAndPlaces(query, neighborhood) {
  const features = await searchPhoton(query, neighborhood.bounds)
  const streets = new Map()
  const places = []

  for (const feature of features) {
    const { name, osm_key: osmKey, district, street, housenumber } = feature.properties
    if (!name) continue
    if (osmKey === 'highway') {
      // Una calle aparece una vez por tramo: se deja una sola, si pasa por el barrio
      if (district === neighborhood.name && !streets.has(normalize(name))) {
        streets.set(normalize(name), { type: 'street', label: name })
      }
      continue
    }
    const [lng, lat] = feature.geometry.coordinates
    if (!isPointInPolygons({ lat, lng }, neighborhood.boundary)) continue
    const detail = street ? `${street}${housenumber ? ` ${housenumber}` : ''}` : null
    places.push({ type: 'place', label: name, detail, lat, lng })
  }

  return [...streets.values(), ...places]
}

/** Direcciones de USIG para "calle altura" que caen dentro del barrio. */
async function geocodeInNeighborhood(address, neighborhood) {
  const results = await geocodeWithUsig(address)
  return results
    .filter((r) => isPointInPolygons(r, neighborhood.boundary))
    .map((r) => ({ type: 'address', ...r }))
}

/**
 * Resuelve con la primera lista no vacía (sin esperar a las demás) o con [] si
 * ninguna trae resultados. USIG tarda hasta 2 s con alturas que no existen.
 * Si fallan todas (servicio caído o timeout) rechaza: no es lo mismo que "no existe".
 */
function firstNonEmpty(promises) {
  return new Promise((resolve, reject) => {
    let pending = promises.length
    let succeeded = 0
    let lastError = null
    if (pending === 0) resolve([])
    for (const promise of promises) {
      promise
        .then((list) => {
          succeeded += 1
          if (list.length > 0) resolve(list)
        })
        .catch((error) => {
          lastError = error
        })
        .finally(() => {
          pending -= 1
          if (pending > 0) return
          if (succeeded > 0) resolve([])
          else reject(lastError)
        })
    }
  })
}

function geocodeCandidates(street, number, neighborhood) {
  return firstNonEmpty(
    candidateNumbers(number).map((n) => geocodeInNeighborhood(`${street} ${n}`, neighborhood)),
  )
}

/** Direcciones "calle altura" dentro del barrio, completando calle y altura. */
async function suggestAddresses(streetPart, number, neighborhood) {
  // Primero lo que escribió el usuario: si la calle está completa, USIG alcanza
  const direct = await geocodeCandidates(streetPart, number, neighborhood)
  if (direct.length > 0) return direct

  // Si no, Photon completa el nombre de la calle ("gurr" → "Gurruchaga")
  const streets = (await suggestStreetsAndPlaces(streetPart, neighborhood))
    .filter((s) => s.type === 'street' && normalize(s.label) !== normalize(streetPart))
    .slice(0, MAX_STREETS_FOR_ADDRESS)
    .map((s) => s.label)
  const results = await Promise.all(streets.map((street) => geocodeCandidates(street, number, neighborhood)))

  const seen = new Set()
  return results.flat().filter((r) => !seen.has(r.label) && seen.add(r.label))
}

/**
 * Sugerencias para el buscador del paso 3, siempre dentro del barrio disponible:
 * - sin número: calles (`type: 'street'`, para que el usuario agregue la altura)
 *   y lugares con coordenadas (`type: 'place'`, ej. "Plaza Serrano");
 * - con número ("gurruchaga 16"): direcciones con coordenadas (`type: 'address'`).
 * Si los servicios externos fallan responde 502: el mapa sigue usable con clicks.
 */
export async function suggestLocations(query) {
  const [neighborhood] = await listNeighborhoods()
  if (!neighborhood) return []

  const key = normalize(query)
  if (cache.has(key)) return cache.get(key)

  const match = query.match(/^(.*\S)[\s,]+(\d{1,5})$/)
  let suggestions
  try {
    suggestions = match
      ? await suggestAddresses(match[1], match[2], neighborhood)
      : await suggestStreetsAndPlaces(query, neighborhood)
  } catch (error) {
    console.warn(`[ProfitZone] No se pudieron buscar sugerencias de direcciones: ${error.message}`)
    throw httpError(502, 'No pudimos buscar direcciones en este momento. Probá de nuevo en un rato.')
  }

  const result = suggestions.slice(0, MAX_SUGGESTIONS)
  // Solo se guardan los resultados no vacíos: un vacío puede venir de un servicio
  // lento o caído (algunos pedidos fallaron) y no tiene que quedar fijo
  if (result.length > 0) {
    if (cache.size >= CACHE_MAX_ENTRIES) cache.delete(cache.keys().next().value)
    cache.set(key, result)
  }
  return result
}

// Un mismo punto (redondeado a ~10 m) devuelve la misma dirección
const reverseCache = new Map()
const REVERSE_PRECISION = 4

/** Puerta más cercana según USIG ("EL SALVADOR 4864"), o null si no hay. */
async function reverseWithUsig({ lat, lng }) {
  const url = new URL(USIG_REVERSE_URL)
  url.search = new URLSearchParams({ x: String(lng), y: String(lat) })
  // USIG responde JSONP sin callback: el JSON viene entre paréntesis
  const body = JSON.parse((await fetchText(url)).trim().replace(/^\(/, '').replace(/\)$/, ''))
  return body.puerta ? toTitleCase(body.puerta) : null
}

/** Calle y altura (o nombre del lugar) más cercanos según Photon, o null. */
async function reverseWithPhoton({ lat, lng }) {
  const url = new URL(PHOTON_REVERSE_URL)
  url.search = new URLSearchParams({ lat: String(lat), lon: String(lng) })
  const body = await fetchJson(url)
  const properties = body.features?.[0]?.properties
  if (!properties) return null
  if (properties.street) return [properties.street, properties.housenumber].filter(Boolean).join(' ')
  return properties.name ?? null
}

/**
 * Dirección más cercana a un punto del barrio, para mostrarla en el buscador
 * cuando el usuario elige el punto en el mapa: `{ label }` (`label: null` si no
 * hay una dirección cerca o el punto cae fuera del barrio). Usa USIG y, si falla
 * o no encuentra nada, Photon. Si fallan los dos responde 502.
 */
export async function reverseGeocode(point) {
  const [neighborhood] = await listNeighborhoods()
  if (!neighborhood || !isPointInPolygons(point, neighborhood.boundary)) return { label: null }

  const key = `${point.lat.toFixed(REVERSE_PRECISION)},${point.lng.toFixed(REVERSE_PRECISION)}`
  if (reverseCache.has(key)) return reverseCache.get(key)

  let label = null
  let failures = 0
  for (const reverse of [reverseWithUsig, reverseWithPhoton]) {
    try {
      label = await reverse(point)
      if (label) break
    } catch (error) {
      failures += 1
      console.warn(`[ProfitZone] Búsqueda inversa de dirección falló: ${error.message}`)
    }
  }
  if (!label && failures === 2) {
    throw httpError(502, 'No pudimos buscar la dirección del punto en este momento.')
  }

  const result = { label }
  // Un vacío con algún servicio caído puede ser temporal: no se guarda
  if (label || failures === 0) {
    if (reverseCache.size >= CACHE_MAX_ENTRIES) reverseCache.delete(reverseCache.keys().next().value)
    reverseCache.set(key, result)
  }
  return result
}
