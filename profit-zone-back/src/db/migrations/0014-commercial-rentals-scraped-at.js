import { runSql } from '../runSql.js'

// Fecha en que se relevó cada aviso (scraped_at del dataset de ZonaProp): el
// reporte la muestra junto a la fuente. NULL en las filas cargadas antes de
// esta migración, hasta volver a correr npm run db:seed:rentals.
export async function up({ sequelize }) {
  await runSql(sequelize, ['ALTER TABLE commercial_data.commercial_rentals ADD scraped_at datetime2 NULL'])
}

export async function down({ sequelize }) {
  await runSql(sequelize, ['ALTER TABLE commercial_data.commercial_rentals DROP COLUMN scraped_at'])
}
