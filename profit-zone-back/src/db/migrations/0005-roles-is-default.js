import { runSql } from '../runSql.js'

// Rol que se asigna por defecto a los usuarios nuevos. El índice filtrado
// garantiza que haya como máximo un rol con is_default = 1.
export async function up({ sequelize }) {
  await runSql(sequelize, [
    `ALTER TABLE users.roles
      ADD is_default bit NOT NULL CONSTRAINT DF_roles_is_default DEFAULT 0`,
    `CREATE UNIQUE INDEX UQ_roles_is_default ON users.roles (is_default) WHERE is_default = 1`,
  ])
}

export async function down({ sequelize }) {
  await runSql(sequelize, [
    'DROP INDEX UQ_roles_is_default ON users.roles',
    'ALTER TABLE users.roles DROP CONSTRAINT DF_roles_is_default',
    'ALTER TABLE users.roles DROP COLUMN is_default',
  ])
}
