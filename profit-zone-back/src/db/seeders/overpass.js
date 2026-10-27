// Cliente de Overpass (OpenStreetMap) compartido por los seeds de osm_data.

const PREFIX = '[ProfitZone]'

// Servidores públicos de Overpass (gratis, sin clave). Suelen estar saturados:
// se prueban en orden y se reintenta varias rondas antes de fallar.
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
]
const ROUNDS = 3
const RETRY_DELAY_MS = 10_000
const REQUEST_TIMEOUT_MS = 200_000

// Margen alrededor del barrio: cubre el radio máximo del análisis (2 km) desde el borde
const MARGIN_METERS = 2100
const METERS_PER_DEGREE_LAT = 111_320

/** Rectángulo del barrio agrandado `MARGIN_METERS` hacia cada lado. */
export function expandBounds({ south, west, north, east }) {
  const dLat = MARGIN_METERS / METERS_PER_DEGREE_LAT
  const midLat = ((south + north) / 2) * (Math.PI / 180)
  const dLng = MARGIN_METERS / (METERS_PER_DEGREE_LAT * Math.cos(midLat))
  return { south: south - dLat, west: west - dLng, north: north + dLat, east: east + dLng }
}

/** Rectángulo en el formato de Overpass: "sur,oeste,norte,este". */
export function toBbox({ south, west, north, east }) {
  return [south, west, north, east].map((n) => n.toFixed(6)).join(',')
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** Corre una consulta de Overpass y devuelve sus `elements`. */
export async function fetchOverpass(query) {
  let lastError = null
  for (let round = 1; round <= ROUNDS; round++) {
    for (const endpoint of OVERPASS_ENDPOINTS) {
      try {
        console.log(`${PREFIX} Consultando Overpass (${new URL(endpoint).host}, ronda ${round})...`)
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'content-type': 'application/x-www-form-urlencoded',
            'user-agent': 'ProfitZone (proyecto UADE)',
          },
          body: new URLSearchParams({ data: query }),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        })
        if (!response.ok) throw new Error(`respondió ${response.status}`)
        const body = await response.json()
        // Con la consulta cortada por timeout, Overpass responde 200 con un "remark"
        if (body.remark) throw new Error(body.remark)
        return body.elements ?? []
      } catch (error) {
        lastError = error
        console.warn(`${PREFIX} Overpass falló: ${error.message}`)
      }
    }
    if (round < ROUNDS) await wait(RETRY_DELAY_MS)
  }
  throw new Error(`Ningún servidor de Overpass respondió: ${lastError?.message}`)
}
