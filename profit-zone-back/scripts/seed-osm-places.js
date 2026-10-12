// Carga en osm_data.places los restaurantes, cafés, gimnasios y estudios de pilates
// de OpenStreetMap del barrio disponible (+2 km), para la vista previa del paso 3.
// Idempotente. Requiere la DB migrada y el censo cargado (npm run db:seed:census).
//
// Uso (desde profit-zone-back/): npm run db:seed:osm-places
import { closeDatabase } from '../src/db/sequelize.js'
import { seedOsmPlaces } from '../src/db/seeders/osmPlaces.js'

const PREFIX = '[ProfitZone]'

try {
  const stats = await seedOsmPlaces()
  console.log(`${PREFIX} Seed de negocios de OSM finalizado:`)
  console.table(stats)
} catch (error) {
  console.error(`${PREFIX} Seed de negocios de OSM falló: ${error.parent?.message ?? error.message}`)
  process.exitCode = 1
} finally {
  await closeDatabase()
}
