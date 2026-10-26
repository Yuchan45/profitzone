import { runSql } from '../runSql.js'

// Nombre que el usuario le pone al análisis (NULL: se muestra el rubro) y dirección
// del punto, que se busca al analizar la zona (NULL si no hay una cerca o si falló la
// búsqueda). Los dos se muestran en "Mis reportes" para distinguir los análisis.
export async function up({ sequelize }) {
  await runSql(sequelize, [
    `ALTER TABLE analysis.analyses ADD
      name nvarchar(80) NULL,
      address nvarchar(255) NULL`,
  ])
}

export async function down({ sequelize }) {
  await runSql(sequelize, ['ALTER TABLE analysis.analyses DROP COLUMN name, address'])
}
