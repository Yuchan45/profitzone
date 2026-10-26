import { runSql } from '../runSql.js'

// Desde PZ-58 un análisis pasa a 'saved' al analizar la zona (cuando se guarda su
// ubicación) y "Mis reportes" lista solo esos. Hasta ahora ninguno pasaba a 'saved':
// los que ya tienen ubicación se marcan como guardados, igual que si se analizaran hoy.
// Los que no la tienen quedan como borradores.
export async function up({ sequelize }) {
  await runSql(sequelize, [
    `UPDATE analysis.analyses SET status = 'saved'
     WHERE status = 'draft' AND radius_m IS NOT NULL`,
  ])
}

// Antes no había análisis guardados: todos vuelven a borrador
export async function down({ sequelize }) {
  await runSql(sequelize, ["UPDATE analysis.analyses SET status = 'draft' WHERE status = 'saved'"])
}
