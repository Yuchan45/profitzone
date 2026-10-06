import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { QueryTypes } from 'sequelize'
import { sequelize } from '../db/sequelize.js'
import { httpError } from '../utils/httpErrors.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FALLBACK_DATA_PATH = path.resolve(__dirname, '../db/seeders/data/zonaprop_locales_caba_alquiler.json')

// undefined: todavía no se buscó el archivo; null: no existe o no tiene avisos
let cachedFallbackData
// Se recuerda solo cuando la tabla ya tiene datos: si está vacía se vuelve a mirar
// (alguien puede correr el seed con la API levantada)
let dbHasRentals = false

function getFallbackCatalog() {
  if (cachedFallbackData !== undefined) return cachedFallbackData
  cachedFallbackData = null
  if (fs.existsSync(FALLBACK_DATA_PATH)) {
    try {
      const catalog = JSON.parse(fs.readFileSync(FALLBACK_DATA_PATH, 'utf8'))
      if (Array.isArray(catalog?.properties)) cachedFallbackData = catalog
    } catch {
      // archivo corrupto: se trata como si no estuviera
    }
  }
  return cachedFallbackData
}

/** Sin avisos cargados no hay fuente: no se responde "0 locales" como si fuera un dato. */
function noRentalDataError() {
  return httpError(503, 'Todavía no hay datos de alquileres cargados para consultar.')
}

async function tableHasRentals() {
  if (dbHasRentals) return true
  const [row] = await sequelize.query('SELECT TOP 1 1 AS found FROM commercial_data.commercial_rentals', {
    type: QueryTypes.SELECT,
  })
  dbHasRentals = Boolean(row)
  return dbHasRentals
}

/**
 * Distancia de Haversine en metros entre dos coordenadas.
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return 0
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c)
}

function calculateMedian(numbers) {
  if (!numbers || numbers.length === 0) return 0
  const sorted = [...numbers].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2)
}

function formatDistance(meters) {
  if (meters < 1000) return `${meters} m`
  return `${(meters / 1000).toFixed(1)} km`
}

function generateRentalCallout(total, avgPriceM2Ars) {
  if (total === 0) {
    return 'No se registraron locales comerciales en oferta dentro del radio seleccionado.'
  }
  if (total >= 15) {
    return `Zona comercial consolidada con alta oferta (${total} locales disponibles). Valor medio de referencia: $${avgPriceM2Ars.toLocaleString('es-AR')}/m².`
  }
  if (total >= 5) {
    return `Oferta comercial moderada (${total} locales en el radio). Valor medio estimado: $${avgPriceM2Ars.toLocaleString('es-AR')}/m².`
  }
  return `Baja disponibilidad de locales comerciales directos en el radio (${total} encontrados).`
}

/**
 * Consulta la base de datos SQL Server mediante índice espacial.
 */
async function queryRentalsFromDb(lat, lng, radiusInMeters) {
  const query = `
    DECLARE @point geography = geography::Point(:lat, :lng, 4326);
    DECLARE @buffer geography = @point.STBuffer(:radiusInMeters);

    SELECT 
      source_id AS id,
      address,
      normalized_address AS normalizedAddress,
      neighborhood,
      sub_neighborhood AS subNeighborhood,
      price_ars AS priceArs,
      price_usd AS priceUsd,
      expensas,
      surface_m2 AS surfaceM2,
      price_per_m2_ars AS pricePerM2Ars,
      price_per_m2_usd AS pricePerM2Usd,
      url,
      geom.Lat AS lat,
      geom.Long AS lng,
      ROUND(geom.STDistance(@point), 0) AS distanceMeters
    FROM commercial_data.commercial_rentals
    WHERE geom.STIntersects(@buffer) = 1
    ORDER BY distanceMeters ASC;
  `

  return await sequelize.query(query, {
    replacements: { lat, lng, radiusInMeters },
    type: QueryTypes.SELECT,
  })
}

/**
 * Consulta de respaldo en memoria si la DB aún no tiene la tabla o está apagada.
 */
function queryRentalsFromFallback(lat, lng, radiusInMeters) {
  const catalog = getFallbackCatalog()
  if (!catalog || !catalog.properties) return []

  const matching = []
  for (const p of catalog.properties) {
    if (p.lat === undefined || p.lng === undefined) continue
    const distanceMeters = calculateHaversineDistance(lat, lng, p.lat, p.lng)
    if (distanceMeters <= radiusInMeters) {
      matching.push({
        id: p.id,
        address: p.address,
        normalizedAddress: p.normalized_address,
        neighborhood: p.neighborhood,
        subNeighborhood: p.sub_neighborhood,
        priceArs: p.price_ars,
        priceUsd: p.price_usd,
        expensas: p.expensas,
        surfaceM2: p.surface_m2,
        pricePerM2Ars: p.price_per_m2_ars,
        pricePerM2Usd: p.price_per_m2_usd,
        url: p.url,
        lat: p.lat,
        lng: p.lng,
        distanceMeters,
      })
    }
  }

  matching.sort((a, b) => a.distanceMeters - b.distanceMeters)
  return matching
}

/**
 * Obtiene el promedio y estadísticas de precios de alquiler comercial en un radio.
 */
export async function getRentalsInRadius({ lat, lng, radiusInMeters = 1000 }) {
  let rows = []
  let source = 'SQL Server (commercial_data.commercial_rentals)'

  let useFallback = false
  try {
    rows = await queryRentalsFromDb(lat, lng, radiusInMeters)
    // Sin filas puede ser que el radio no tenga avisos o que la tabla esté sin cargar
    if (rows.length === 0 && !(await tableHasRentals())) useFallback = true
  } catch (error) {
    // Si la DB falla o no tiene la tabla migrada, se utiliza el seeder JSON local
    console.warn(`[ProfitZone] No se pudieron consultar los alquileres en la DB: ${error.message}`)
    useFallback = true
  }

  if (useFallback) {
    if (!getFallbackCatalog()) throw noRentalDataError()
    rows = queryRentalsFromFallback(lat, lng, radiusInMeters)
    source = 'Dataset Local (zonaprop_locales_caba_alquiler.json)'
  }

  const fallbackCatalog = getFallbackCatalog()
  const exchangeRate = fallbackCatalog?.exchange_rate_official || { rate: 1540.0, source: 'DolarAPI Oficial' }

  if (!rows || rows.length === 0) {
    return {
      center: { lat, lng },
      radiusInMeters,
      totalInRadius: 0,
      pricedInRadius: 0,
      averageRentArs: 0,
      medianRentArs: 0,
      averageRentUsd: 0,
      medianRentUsd: 0,
      averagePricePerM2Ars: 0,
      medianPricePerM2Ars: 0,
      averagePricePerM2Usd: 0,
      medianPricePerM2Usd: 0,
      averageSurfaceM2: 0,
      minRentArs: 0,
      maxRentArs: 0,
      neighborhoods: [],
      callout: 'No se encontraron locales comerciales en oferta dentro del radio seleccionado.',
      source,
      exchangeRate,
      places: [],
    }
  }

  const pricesArs = []
  const pricesUsd = []
  const pricesM2Ars = []
  const pricesM2Usd = []
  const surfaces = []
  const neighborhoodsSet = new Set()

  for (const r of rows) {
    if (r.priceArs) pricesArs.push(Number(r.priceArs))
    if (r.priceUsd) pricesUsd.push(Number(r.priceUsd))
    if (r.pricePerM2Ars) pricesM2Ars.push(Number(r.pricePerM2Ars))
    if (r.pricePerM2Usd) pricesM2Usd.push(Number(r.pricePerM2Usd))
    if (r.surfaceM2) surfaces.push(Number(r.surfaceM2))
    if (r.neighborhood) neighborhoodsSet.add(r.neighborhood)
  }

  const avg = (arr) => (arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0)
  const avgFloat = (arr) => (arr.length > 0 ? Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2)) : 0)

  const averageRentArs = avg(pricesArs)
  const medianRentArs = calculateMedian(pricesArs)
  const averageRentUsd = avg(pricesUsd)
  const medianRentUsd = calculateMedian(pricesUsd)

  const averagePricePerM2Ars = avg(pricesM2Ars)
  const medianPricePerM2Ars = calculateMedian(pricesM2Ars)
  const averagePricePerM2Usd = avgFloat(pricesM2Usd)
  const medianPricePerM2Usd = calculateMedian(pricesM2Usd)

  const averageSurfaceM2 = avg(surfaces)
  const minRentArs = pricesArs.length > 0 ? Math.min(...pricesArs) : 0
  const maxRentArs = pricesArs.length > 0 ? Math.max(...pricesArs) : 0

  const places = rows.map((p) => ({
    ...p,
    distanceText: formatDistance(p.distanceMeters),
  }))

  const callout = generateRentalCallout(rows.length, averagePricePerM2Ars)

  return {
    center: { lat, lng },
    radiusInMeters,
    totalInRadius: rows.length,
    // Avisos con precio en pesos: son los que entran en el promedio y la mediana
    pricedInRadius: pricesArs.length,
    averageRentArs,
    medianRentArs,
    averageRentUsd,
    medianRentUsd,
    averagePricePerM2Ars,
    medianPricePerM2Ars,
    averagePricePerM2Usd,
    medianPricePerM2Usd,
    averageSurfaceM2,
    minRentArs,
    maxRentArs,
    neighborhoods: Array.from(neighborhoodsSet).sort(),
    callout,
    source,
    exchangeRate,
    places,
  }
}
