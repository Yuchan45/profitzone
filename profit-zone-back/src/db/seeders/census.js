import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { sequelize } from '../sequelize.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const GEOJSON_PATH = path.resolve(__dirname, 'data/caba_census_radios.geojson')

/**
 * Convierte una geometría GeoJSON MultiPolygon a WKT (Well-Known Text).
 * Coordenadas en formato: (longitude latitude).
 */
export function multiPolygonToWkt(geometry) {
  if (geometry.type !== 'MultiPolygon') {
    throw new Error(`Tipo de geometría no soportado: ${geometry.type}`)
  }

  const polygons = geometry.coordinates.map((poly) => {
    const rings = poly.map((ring) => {
      const points = ring.map(([lng, lat]) => `${lng} ${lat}`).join(', ')
      return `(${points})`
    })
    return `(${rings.join(', ')})`
  })

  return `MULTIPOLYGON (${polygons.join(', ')})`
}

/**
 * Carga e indexa los radios censales de CABA en census_data.census_radios.
 * Es idempotente: si el radio ya existe lo actualiza, si no existe lo inserta.
 */
export async function seedCensusData({ batchSize = 100 } = {}) {
  if (!fs.existsSync(GEOJSON_PATH)) {
    throw new Error(`No se encontró el archivo GeoJSON en ${GEOJSON_PATH}`)
  }

  const raw = fs.readFileSync(GEOJSON_PATH, 'utf8')
  const geojson = JSON.parse(raw)
  const features = geojson.features || []

  const stats = {
    total: features.length,
    processed: 0,
    errors: 0,
  }

  console.log(`[ProfitZone] Iniciando carga de ${features.length} radios censales de CABA en census_data...`)

  // Procesamos en lotes dentro de una transacción para máximo rendimiento
  await sequelize.transaction(async (transaction) => {
    for (let i = 0; i < features.length; i += batchSize) {
      const batch = features.slice(i, i + batchSize)

      for (const feature of batch) {
        const props = feature.properties
        const wkt = multiPolygonToWkt(feature.geometry)

        const query = `
          MERGE census_data.census_radios AS target
          USING (
            SELECT 
              :radioId AS radio_id,
              :barrio AS barrio,
              :comuna AS comuna,
              :poblacion AS poblacion,
              :viviendas AS viviendas,
              :hogares AS hogares,
              :hogaresNbi AS hogares_nbi,
              :edad0a14 AS edad_0_14,
              :edad15a34 AS edad_15_34,
              :edad35a59 AS edad_35_59,
              :edad60Mas AS edad_60_mas,
              :mujeres AS mujeres,
              :varones AS varones,
              :areaKm2 AS area_km2,
              :wkt AS wkt
          ) AS source
          ON target.radio_id = source.radio_id
          WHEN MATCHED THEN
            UPDATE SET 
              barrio = source.barrio,
              comuna = source.comuna,
              poblacion = source.poblacion,
              viviendas = source.viviendas,
              hogares = source.hogares,
              hogares_nbi = source.hogares_nbi,
              edad_0_14 = source.edad_0_14,
              edad_15_34 = source.edad_15_34,
              edad_35_59 = source.edad_35_59,
              edad_60_mas = source.edad_60_mas,
              mujeres = source.mujeres,
              varones = source.varones,
              area_km2 = source.area_km2
          WHEN NOT MATCHED THEN
            INSERT (
              radio_id, barrio, comuna, poblacion, viviendas, hogares, hogares_nbi,
              edad_0_14, edad_15_34, edad_35_59, edad_60_mas, mujeres, varones,
              area_km2, geom
            )
            VALUES (
              source.radio_id,
              source.barrio,
              source.comuna,
              source.poblacion,
              source.viviendas,
              source.hogares,
              source.hogares_nbi,
              source.edad_0_14,
              source.edad_15_34,
              source.edad_35_59,
              source.edad_60_mas,
              source.mujeres,
              source.varones,
              source.area_km2,
              CASE 
                WHEN geography::STGeomFromText(source.wkt, 4326).MakeValid().EnvelopeAngle() > 90 
                THEN geography::STGeomFromText(source.wkt, 4326).MakeValid().ReorientObject() 
                ELSE geography::STGeomFromText(source.wkt, 4326).MakeValid() 
              END
            );
        `

        await sequelize.query(query, {
          replacements: {
            radioId: String(props.RADIO_ID),
            barrio: String(props.BARRIO || 'DESCONOCIDO'),
            comuna: Number(props.COMUNA) || 0,
            poblacion: Math.round(Number(props.POBLACION)) || 0,
            viviendas: Math.round(Number(props.VIVIENDAS)) || 0,
            hogares: Math.round(Number(props.HOGARES)) || 0,
            hogaresNbi: Math.round(Number(props.HOGARES_NBI)) || 0,
            edad0a14: Math.round(Number(props.EDAD_0_14)) || 0,
            edad15a34: Math.round(Number(props.EDAD_15_34)) || 0,
            edad35a59: Math.round(Number(props.EDAD_35_59)) || 0,
            edad60Mas: Math.round(Number(props.EDAD_60_MAS)) || 0,
            mujeres: Math.round(Number(props.MUJERES)) || 0,
            varones: Math.round(Number(props.VARONES)) || 0,
            areaKm2: Number(props.AREA_KM2) || 0,
            wkt,
          },
          transaction,
        })

        stats.processed++
      }

      if ((i + batchSize) % 500 === 0 || i + batchSize >= features.length) {
        console.log(`[ProfitZone] Progreso: ${Math.min(i + batchSize, features.length)} / ${features.length} radios procesados.`)
      }
    }
  })

  return stats
}

