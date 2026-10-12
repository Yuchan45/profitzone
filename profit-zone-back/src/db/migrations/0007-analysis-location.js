import { runSql } from '../runSql.js'

// Punto y radio del análisis. Son NULL hasta que el usuario elige la ubicación
// (paso 3), pero van los tres juntos: no puede quedar un punto sin radio.
export async function up({ sequelize }) {
  await runSql(sequelize, [
    `ALTER TABLE analysis.analyses ADD
      center_lat decimal(9,6) NULL,
      center_lng decimal(9,6) NULL,
      radius_m int NULL`,
    `ALTER TABLE analysis.analyses ADD CONSTRAINT CK_analyses_location CHECK (
      (center_lat IS NULL AND center_lng IS NULL AND radius_m IS NULL)
      OR (center_lat IS NOT NULL AND center_lng IS NOT NULL AND radius_m IS NOT NULL)
    )`,
  ])
}

export async function down({ sequelize }) {
  await runSql(sequelize, [
    'ALTER TABLE analysis.analyses DROP CONSTRAINT CK_analyses_location',
    'ALTER TABLE analysis.analyses DROP COLUMN center_lat, center_lng, radius_m',
  ])
}
