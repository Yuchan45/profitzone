import { sequelize } from '../db/sequelize.js'
import { calculateDistanceMeters } from '../utils/geo.js'
import { KINDS_BY_SUBCATEGORY, directCriteria } from './places.service.js'
import { groupStops } from './accessibility.service.js'
import { rentalExchangeRate } from './rentals.service.js'
import { isDirectOsmPlace } from '../utils/cuisineMatch.js'

/**
 * Referencias de Palermo para leer los datos del reporte ("¿esto es mucho o poco?").
 * Cada dato del punto se compara con el mismo dato medido, con el mismo radio y el mismo
 * método, desde el centro de cada radio censal de Palermo (295 puntos de referencia). Los
 * radios censales son más chicos donde vive más gente, así los parques y el Aeroparque
 * casi no pesan. Resultado por dato: mediana de Palermo y percentil del punto.
 * Los datos (OSM, avisos, censo) solo cambian con los seeds: se cargan en memoria una
 * vez y cada distribución se guarda por radio y rubro.
 */

const REFERENCE_NEIGHBORHOOD = 'PALERMO'
// Una mediana de alquiler con menos avisos que esto no se compara (ni en el punto ni en
// los puntos de referencia)
const MIN_RENT_LISTINGS = 3
const METERS_PER_DEGREE_LAT = 111_320

let datasetPromise = null
const distributions = new Map()

async function loadDataset() {
  const query = (sql, replacements = {}) => sequelize.query(sql, { replacements }).then(([rows]) => rows)
  const [references, palermo, places, stops, rentals] = await Promise.all([
    query(
      `SELECT geom.EnvelopeCenter().Lat AS lat, geom.EnvelopeCenter().Long AS lng
       FROM census_data.census_radios WHERE barrio = :barrio`,
      { barrio: REFERENCE_NEIGHBORHOOD },
    ),
    query(
      `SELECT SUM(poblacion) AS population, SUM(geom.STArea()) / 1000000 AS areaKm2
       FROM census_data.census_radios WHERE barrio = :barrio`,
      { barrio: REFERENCE_NEIGHBORHOOD },
    ),
    query(`SELECT kind, name, cuisine, geom.Lat AS lat, geom.Long AS lng FROM osm_data.places WHERE is_active = 1`),
    query(
      `SELECT id, kind, name, lines, geom.Lat AS lat, geom.Long AS lng
       FROM osm_data.transit_stops WHERE is_active = 1`,
    ),
    query(
      `SELECT price_ars AS priceArs, price_usd AS priceUsd, geom.Lat AS lat, geom.Long AS lng
       FROM commercial_data.commercial_rentals
       WHERE price_ars IS NOT NULL OR price_usd IS NOT NULL`,
    ),
  ])
  if (references.length === 0) throw new Error('No hay radios censales de Palermo: corré npm run db:seed:census.')

  // Igual que el indicador de alquiler: los avisos solo en dólares se pasan a pesos
  const { rate } = rentalExchangeRate()
  return {
    references,
    palermoDensity: palermo[0].population / palermo[0].areaKm2,
    places,
    stops,
    rentals: rentals.map((row) => ({
      lat: row.lat,
      lng: row.lng,
      priceArs: row.priceArs ? Number(row.priceArs) : Math.round(Number(row.priceUsd) * rate),
    })),
  }
}

function getDataset() {
  datasetPromise ??= loadDataset().catch((error) => {
    // Sin cachear el fallo: puede que falte un seed que se corre con la API levantada
    datasetPromise = null
    throw error
  })
  return datasetPromise
}

/** Elementos a menos de `radius` metros del punto, de más cerca a más lejos. */
function within(items, lat, lng, radius) {
  const dLat = radius / METERS_PER_DEGREE_LAT
  const dLng = radius / (METERS_PER_DEGREE_LAT * Math.cos((lat * Math.PI) / 180))
  return items
    .filter((item) => Math.abs(item.lat - lat) <= dLat && Math.abs(item.lng - lng) <= dLng)
    .map((item) => ({ ...item, distance: calculateDistanceMeters(lat, lng, item.lat, item.lng) }))
    .filter((item) => item.distance <= radius)
    .sort((a, b) => a.distance - b.distance)
}

function median(sorted) {
  if (sorted.length === 0) return null
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

/**
 * Compara el valor del punto con la distribución de Palermo. `percentile`: porcentaje de
 * puntos de referencia con un valor menor (los empates cuentan la mitad).
 */
function compare(value, sorted) {
  if (value === null || sorted.length === 0) return null
  const below = sorted.filter((reference) => reference < value).length
  const equal = sorted.filter((reference) => reference === value).length
  return {
    value,
    median: median(sorted),
    percentile: Math.round(((below + equal / 2) / sorted.length) * 100),
    referenceCount: sorted.length,
  }
}

/** Distribución de un dato en los puntos de referencia (calculada una vez por clave). */
function distribution(key, dataset, measure) {
  if (!distributions.has(key)) {
    const values = dataset.references
      .map((reference) => measure(reference.lat, reference.lng))
      .filter((value) => value !== null)
      .sort((a, b) => a - b)
    distributions.set(key, values)
  }
  return distributions.get(key)
}

function medianRent(dataset, lat, lng, radius) {
  const prices = within(dataset.rentals, lat, lng, radius)
    .map((listing) => listing.priceArs)
    .sort((a, b) => a - b)
  return prices.length >= MIN_RENT_LISTINGS ? median(prices) : null
}

/**
 * Referencias de Palermo para un reporte: competencia (locales del rubro y directos según
 * OpenStreetMap), transporte (paradas y estaciones, contadas como en el indicador),
 * alquiler (mediana de los avisos del radio) y densidad de población (promedio del barrio,
 * sin percentil: el censo no permite medir cada punto de referencia con el mismo método).
 */
export async function getBenchmarks({ lat, lng, radiusInMeters, categoryCode, subcategoryCode, match, density }) {
  const dataset = await getDataset()
  const radius = radiusInMeters
  const result = { neighborhood: 'Palermo', radiusInMeters: radius, referencePoints: dataset.references.length }

  const kinds = KINDS_BY_SUBCATEGORY[`${categoryCode}/${subcategoryCode}`]
  if (kinds) {
    const criteria = await directCriteria(categoryCode, subcategoryCode, match).catch(() => null)
    const ofRubro = dataset.places.filter((place) => kinds.includes(place.kind))
    const direct = criteria ? ofRubro.filter((place) => isDirectOsmPlace(criteria, place)) : null
    const count = (items) => (pointLat, pointLng) => within(items, pointLat, pointLng, radius).length
    const rubroKey = `${categoryCode}/${subcategoryCode}`
    result.competition = compare(
      count(ofRubro)(lat, lng),
      distribution(`competition|${rubroKey}|${radius}`, dataset, count(ofRubro)),
    )
    if (direct) {
      result.direct = compare(
        count(direct)(lat, lng),
        distribution(`direct|${rubroKey}|${match}|${radius}`, dataset, count(direct)),
      )
    }
  }

  const stopCount = (pointLat, pointLng) => groupStops(within(dataset.stops, pointLat, pointLng, radius)).length
  result.transit = compare(stopCount(lat, lng), distribution(`transit|${radius}`, dataset, stopCount))

  const rentAt = (pointLat, pointLng) => medianRent(dataset, pointLat, pointLng, radius)
  result.rent = compare(rentAt(lat, lng), distribution(`rent|${radius}`, dataset, rentAt))

  if (typeof density === 'number') {
    result.population = {
      value: density,
      average: Math.round(dataset.palermoDensity),
      ratio: Number((density / dataset.palermoDensity).toFixed(2)),
    }
  }

  return result
}
