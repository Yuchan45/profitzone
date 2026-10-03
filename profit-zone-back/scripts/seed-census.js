// Carga los radios censales de CABA en census_data.census_radios.
// Idempotente: se puede correr N veces. Requiere la DB migrada (npm run db:migrate).
//
// Uso (desde profit-zone-back/): npm run db:seed:census
import { closeDatabase } from '../src/db/sequelize.js'
import { seedCensusData } from '../src/db/seeders/census.js'

const PREFIX = '[ProfitZone]'

try {
  const stats = await seedCensusData()
  console.log(`${PREFIX} Seed de datos censales finalizado exitosamente:`)
  console.table(stats)
} catch (error) {
  console.error(`${PREFIX} Seed de datos censales falló: ${error.parent?.message ?? error.message}`)
  process.exitCode = 1
} finally {
  await closeDatabase()
}

