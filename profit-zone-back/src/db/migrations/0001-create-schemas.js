import { runSql } from '../runSql.js'

const SCHEMAS = ['users', 'catalog', 'analysis']

export async function up({ sequelize }) {
  await runSql(
    sequelize,
    SCHEMAS.map((schema) => `CREATE SCHEMA [${schema}]`),
  )
}

export async function down({ sequelize }) {
  await runSql(
    sequelize,
    [...SCHEMAS].reverse().map((schema) => `DROP SCHEMA [${schema}]`),
  )
}
