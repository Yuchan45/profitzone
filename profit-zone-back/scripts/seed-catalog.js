// Carga el catálogo base (roles, categorías, preguntas...). Idempotente: se
// puede correr N veces. Requiere la DB migrada (npm run db:migrate).
//
// Uso (desde profit-zone-back/): npm run db:seed:catalog
import { closeDatabase } from '../src/db/sequelize.js'
import { seedCatalog } from '../src/db/seeders/catalog.js'

const PREFIX = '[ProfitZone]'

try {
  const stats = await seedCatalog()
  console.log(`${PREFIX} Seed del catálogo aplicado:`)
  console.table(stats)
} catch (error) {
  console.error(`${PREFIX} Seed del catálogo falló (no se aplicó nada): ${error.parent?.message ?? error.message}`)
  process.exitCode = 1
} finally {
  await closeDatabase()
}
