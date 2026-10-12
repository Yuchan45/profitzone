import { runSql } from '../runSql.js'

// Rotación de refresh tokens: cada token usado apunta al que lo reemplazó
// (replaced_by_id), así se puede auditar la cadena y detectar el reuso de un
// token ya rotado. user_agent e ip identifican la sesión (dispositivo).
export async function up({ sequelize }) {
  await runSql(sequelize, [
    `ALTER TABLE users.auth_tokens ADD
      replaced_by_id uniqueidentifier NULL,
      user_agent nvarchar(300) NULL,
      ip varchar(45) NULL`,
    `ALTER TABLE users.auth_tokens
      ADD CONSTRAINT FK_auth_tokens_replaced_by_id
      FOREIGN KEY (replaced_by_id) REFERENCES users.auth_tokens (id)`,
  ])
}

export async function down({ sequelize }) {
  await runSql(sequelize, [
    'ALTER TABLE users.auth_tokens DROP CONSTRAINT FK_auth_tokens_replaced_by_id',
    'ALTER TABLE users.auth_tokens DROP COLUMN replaced_by_id, user_agent, ip',
  ])
}
