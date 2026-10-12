import { runSql } from '../runSql.js'

// Todo análisis tiene dueño: se crea recién cuando el usuario tiene sesión.
// Los borradores sin dueño que quedaron de antes (anónimos que abandonaron el flujo)
// no los puede retomar nadie, así que se borran (sus respuestas caen por ON DELETE CASCADE).
// La FK depende de la columna: se recrea para poder cambiarla a NOT NULL.
export async function up({ sequelize }) {
  await runSql(sequelize, [
    'DELETE FROM analysis.analyses WHERE user_id IS NULL',
    'ALTER TABLE analysis.analyses DROP CONSTRAINT FK_analyses_user_id',
    'ALTER TABLE analysis.analyses ALTER COLUMN user_id uniqueidentifier NOT NULL',
    `ALTER TABLE analysis.analyses ADD CONSTRAINT FK_analyses_user_id
      FOREIGN KEY (user_id) REFERENCES users.users (id)`,
  ])
}

// Vuelve a permitir NULL; los borradores borrados no se recuperan
export async function down({ sequelize }) {
  await runSql(sequelize, [
    'ALTER TABLE analysis.analyses DROP CONSTRAINT FK_analyses_user_id',
    'ALTER TABLE analysis.analyses ALTER COLUMN user_id uniqueidentifier NULL',
    `ALTER TABLE analysis.analyses ADD CONSTRAINT FK_analyses_user_id
      FOREIGN KEY (user_id) REFERENCES users.users (id)`,
  ])
}
