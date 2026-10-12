import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { sequelize } from '../sequelize.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_PATH = path.resolve(__dirname, 'data/zonaprop_locales_caba_alquiler.json')

/**
 * Carga e indexa los locales comerciales en alquiler en commercial_data.commercial_rentals.
 * Es idempotente: si el local ya existe (por source_id) lo actualiza, si no existe lo inserta.
 */
export async function seedCommercialRentals({ batchSize = 100 } = {}) {
  if (!fs.existsSync(DATA_PATH)) {
    throw new Error(`No se encontró el archivo de locales en ${DATA_PATH}`)
  }

  const raw = fs.readFileSync(DATA_PATH, 'utf8')
  const catalog = JSON.parse(raw)
  const properties = catalog.properties || []

  const stats = {
    total: properties.length,
    processed: 0,
    errors: 0,
  }

  console.log(`[ProfitZone] Iniciando carga de ${properties.length} locales comerciales en commercial_data...`)

  for (let i = 0; i < properties.length; i += batchSize) {
    const batch = properties.slice(i, i + batchSize)

    await sequelize.transaction(async (transaction) => {
      for (const p of batch) {
        if (!p.id || p.lat === undefined || p.lng === undefined) {
          stats.errors++
          continue
        }

        const query = `
          MERGE commercial_data.commercial_rentals AS target
          USING (
            SELECT 
              :sourceId AS source_id,
              :operationType AS operation_type,
              :address AS address,
              :normalizedAddress AS normalized_address,
              :neighborhood AS neighborhood,
              :subNeighborhood AS sub_neighborhood,
              :currencyOriginal AS currency_original,
              :priceRaw AS price_raw,
              :priceArs AS price_ars,
              :priceUsd AS price_usd,
              :expensas AS expensas,
              :surfaceM2 AS surface_m2,
              :pricePerM2Ars AS price_per_m2_ars,
              :pricePerM2Usd AS price_per_m2_usd,
              :url AS url,
              :locationPrecision AS location_precision,
              :geocodingSource AS geocoding_source,
              geography::Point(:lat, :lng, 4326) AS geom
          ) AS source
          ON target.source_id = source.source_id
          WHEN MATCHED THEN
            UPDATE SET 
              operation_type = source.operation_type,
              address = source.address,
              normalized_address = source.normalized_address,
              neighborhood = source.neighborhood,
              sub_neighborhood = source.sub_neighborhood,
              currency_original = source.currency_original,
              price_raw = source.price_raw,
              price_ars = source.price_ars,
              price_usd = source.price_usd,
              expensas = source.expensas,
              surface_m2 = source.surface_m2,
              price_per_m2_ars = source.price_per_m2_ars,
              price_per_m2_usd = source.price_per_m2_usd,
              url = source.url,
              location_precision = source.location_precision,
              geocoding_source = source.geocoding_source,
              geom = source.geom
          WHEN NOT MATCHED THEN
            INSERT (
              source_id, operation_type, address, normalized_address, neighborhood, sub_neighborhood,
              currency_original, price_raw, price_ars, price_usd, expensas, surface_m2,
              price_per_m2_ars, price_per_m2_usd, url, location_precision, geocoding_source, geom
            )
            VALUES (
              source.source_id, source.operation_type, source.address, source.normalized_address, source.neighborhood, source.sub_neighborhood,
              source.currency_original, source.price_raw, source.price_ars, source.price_usd, source.expensas, source.surface_m2,
              source.price_per_m2_ars, source.price_per_m2_usd, source.url, source.location_precision, source.geocoding_source, source.geom
            );
        `

        await sequelize.query(query, {
          replacements: {
            sourceId: String(p.id),
            operationType: String(p.operation_type || 'Alquiler'),
            address: p.address ? String(p.address) : null,
            normalizedAddress: p.normalized_address ? String(p.normalized_address) : null,
            neighborhood: p.neighborhood ? String(p.neighborhood) : null,
            subNeighborhood: p.sub_neighborhood ? String(p.sub_neighborhood) : null,
            currencyOriginal: p.currency_original ? String(p.currency_original) : null,
            priceRaw: p.price_raw !== undefined && p.price_raw !== null ? Number(p.price_raw) : null,
            priceArs: p.price_ars !== undefined && p.price_ars !== null ? Number(p.price_ars) : null,
            priceUsd: p.price_usd !== undefined && p.price_usd !== null ? Number(p.price_usd) : null,
            expensas: p.expensas !== undefined && p.expensas !== null ? Number(p.expensas) : null,
            surfaceM2: p.surface_m2 !== undefined && p.surface_m2 !== null ? Number(p.surface_m2) : null,
            pricePerM2Ars: p.price_per_m2_ars !== undefined && p.price_per_m2_ars !== null ? Number(p.price_per_m2_ars) : null,
            pricePerM2Usd: p.price_per_m2_usd !== undefined && p.price_per_m2_usd !== null ? Number(p.price_per_m2_usd) : null,
            url: p.url ? String(p.url) : null,
            locationPrecision: p.location_precision ? String(p.location_precision) : null,
            geocodingSource: p.geocoding_source ? String(p.geocoding_source) : null,
            lat: Number(p.lat),
            lng: Number(p.lng),
          },
          transaction,
        })

        stats.processed++
      }
    })

    if ((i + batchSize) % 500 === 0 || i + batchSize >= properties.length) {
      console.log(`[ProfitZone] Progreso: ${Math.min(i + batchSize, properties.length)} / ${properties.length} locales cargados.`)
    }
  }

  return stats
}
