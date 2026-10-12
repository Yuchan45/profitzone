// Carga los locales comerciales en alquiler en commercial_data.commercial_rentals.
// Idempotente: se puede correr N veces. Requiere la DB migrada (npm run db:migrate).
//
// Uso (desde profit-zone-back/): npm run db:seed:rentals
import { closeDatabase } from '../src/db/sequelize.js'
import { seedCommercialRentals } from '../src/db/seeders/commercialRentals.js'

const PREFIX = '[ProfitZone]'

try {
  const stats = await seedCommercialRentals()
  console.log(`${PREFIX} Seed de locales comerciales finalizado exitosamente:`)
  console.table(stats)
} catch (error) {
  console.error(`${PREFIX} Seed de locales comerciales falló: ${error.parent?.message ?? error.message}`)
  process.exitCode = 1
} finally {
  await closeDatabase()
}
