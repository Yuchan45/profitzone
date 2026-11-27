import { runSql } from '../runSql.js'

// "Continuar con Google": la cuenta guarda el `sub` de Google (identificador estable) para
// reconocerla aunque cambie de correo. Es único cuando existe; las cuentas sin Google tienen NULL
// (por eso es un índice filtrado: SQL Server solo permite un NULL en un índice único común).
export async function up({ sequelize }) {
  await runSql(sequelize, [
    'ALTER TABLE users.users ADD google_sub varchar(64) NULL',
    `CREATE UNIQUE INDEX UX_users_google_sub ON users.users (google_sub) WHERE google_sub IS NOT NULL`,
  ])
}

export async function down({ sequelize }) {
  await runSql(sequelize, [
    'DROP INDEX UX_users_google_sub ON users.users',
    'ALTER TABLE users.users DROP COLUMN google_sub',
  ])
}
