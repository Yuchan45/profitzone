// Carga en osm_data.transit_stops las paradas de colectivo y estaciones de subte y tren
// de OpenStreetMap del barrio disponible (+2 km), para el indicador de accesibilidad.
// Idempotente. Requiere la DB migrada y el censo cargado (npm run db:seed:census).
//
// Uso (desde profit-zone-back/): npm run db:seed:osm-transit
import { closeDatabase } from '../src/db/sequelize.js'
import { seedOsmTransit } from '../src/db/seeders/osmTransit.js'

const PREFIX = '[ProfitZone]'

try {
  const stats = await seedOsmTransit()
  console.log(`${PREFIX} Seed de transporte de OSM finalizado:`)
  console.table(stats)
} catch (error) {
  console.error(`${PREFIX} Seed de transporte de OSM falló: ${error.parent?.message ?? error.message}`)
  process.exitCode = 1
} finally {
  await closeDatabase()
}
