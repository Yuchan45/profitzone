// Carga en osm_data.audience_places los lugares de OpenStreetMap que atraen a cada
// público (escuelas, universidades, oficinas, centros de jubilados...) del barrio
// disponible (+2 km), para el criterio "Según tu público" del reporte (PZ-50).
// Idempotente. Requiere la DB migrada y el censo cargado (npm run db:seed:census).
//
// Uso (desde profit-zone-back/): npm run db:seed:osm-audience
import { closeDatabase } from '../src/db/sequelize.js'
import { seedOsmAudiencePlaces } from '../src/db/seeders/osmAudiencePlaces.js'

const PREFIX = '[ProfitZone]'

try {
  const stats = await seedOsmAudiencePlaces()
  console.log(`${PREFIX} Seed de lugares por público de OSM finalizado:`)
  console.table(stats)
} catch (error) {
  console.error(`${PREFIX} Seed de lugares por público de OSM falló: ${error.parent?.message ?? error.message}`)
  process.exitCode = 1
} finally {
  await closeDatabase()
}
