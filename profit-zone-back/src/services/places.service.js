import { sequelize } from '../db/sequelize.js'
import { getSubcategorySurvey } from './questions.service.js'
import { httpError } from '../utils/httpErrors.js'

// Tipos de negocio de osm_data.places que son competencia de cada subcategoría
const KINDS_BY_SUBCATEGORY = {
  'gastronomia/restaurante': ['restaurant', 'fast_food'],
  'gastronomia/cafeteria': ['cafe'],
  'fitness/gimnasio': ['fitness'],
  'fitness/pilates': ['pilates'],
}

// Tope de puntos por respuesta: con 2 km en Palermo puede haber más de mil
const MAX_PLACES = 1500

/**
 * Valores de cocina de OSM que cuentan como competencia directa según la opción
 * elegida en la encuesta (`metadata.osmCuisine`). `match` = "pregunta:opción".
 * Devuelve null si no hay criterio (sin `match` u opción sin mapeo, ej. "Otra").
 */
async function directCriteria(categoryCode, subcategoryCode, match) {
  if (!match) return null
  const [questionCode, optionCode] = match.split(':')
  const survey = await getSubcategorySurvey(categoryCode, subcategoryCode)
  const question = [...survey.business, ...survey.details].find((q) => q.code === questionCode)
  const option = question?.options.find((o) => o.code === optionCode)
  if (!option) throw httpError(400, `La respuesta "${match}" no corresponde a este rubro.`)
  const cuisines = option.metadata?.osmCuisine
  return cuisines?.length ? { cuisines: new Set(cuisines), label: option.label } : null
}

/**
 * Negocios del rubro dentro del círculo, para la vista previa del paso 3. Los datos
 * vienen de OpenStreetMap (osm_data.places, `npm run db:seed:osm-places`): es gratis
 * y no consume la API paga de Google Places, que queda para el reporte.
 * Cada punto trae `direct`: si coincide con la cocina elegida (competencia directa).
 */
export async function findNearbyPlaces({ lat, lng, radius, categoryCode, subcategoryCode, match }) {
  const kinds = KINDS_BY_SUBCATEGORY[`${categoryCode}/${subcategoryCode}`]
  if (!kinds) throw httpError(400, `No hay vista previa para el rubro "${categoryCode}/${subcategoryCode}".`)
  const criteria = await directCriteria(categoryCode, subcategoryCode, match)

  const [rows] = await sequelize.query(
    `DECLARE @point geography = geography::Point(:lat, :lng, 4326);
     SELECT id, name, cuisine, geom.Lat AS lat, geom.Long AS lng, last_seen_at AS lastSeenAt
     FROM osm_data.places
     WHERE is_active = 1 AND kind IN (:kinds) AND geom.STDistance(@point) <= :radius
     ORDER BY geom.STDistance(@point)`,
    { replacements: { lat, lng, radius, kinds } },
  )

  const isDirect = (cuisine) =>
    Boolean(criteria && cuisine && cuisine.split(';').some((value) => criteria.cuisines.has(value.trim())))
  const places = rows.map((row) => ({
    id: row.id,
    name: row.name,
    lat: row.lat,
    lng: row.lng,
    direct: isDirect(row.cuisine),
  }))
  const updatedAt = rows.reduce((latest, row) => (row.lastSeenAt > latest ? row.lastSeenAt : latest), null)

  return {
    source: 'OpenStreetMap',
    updatedAt,
    total: places.length,
    directTotal: places.filter((place) => place.direct).length,
    directLabel: criteria?.label ?? null,
    places: places.slice(0, MAX_PLACES),
  }
}

/**
 * Ficha de un negocio de la vista previa: nombre, tipo, cocina (valores de OSM),
 * punto y los datos que tenga en OSM (`details`: dirección, horarios, contacto,
 * servicios; cada local trae un subconjunto distinto). Lanza 404 si no existe.
 */
export async function getPlace(id) {
  const [rows] = await sequelize.query(
    `SELECT id, kind, name, cuisine, details, geom.Lat AS lat, geom.Long AS lng, last_seen_at AS lastSeenAt
     FROM osm_data.places
     WHERE id = :id AND is_active = 1`,
    { replacements: { id } },
  )
  const place = rows[0]
  if (!place) throw httpError(404, 'No encontramos ese negocio.')

  return {
    id: place.id,
    kind: place.kind,
    name: place.name,
    cuisines: place.cuisine ? place.cuisine.split(';').map((value) => value.trim()).filter(Boolean) : [],
    lat: place.lat,
    lng: place.lng,
    details: place.details ? JSON.parse(place.details) : {},
    source: 'OpenStreetMap',
    updatedAt: place.lastSeenAt,
  }
}
