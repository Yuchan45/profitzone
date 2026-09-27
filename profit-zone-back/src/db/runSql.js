/**
 * Ejecuta sentencias T-SQL en orden dentro de una transacción (SQL Server
 * permite DDL transaccional: si una falla, no queda nada a medias).
 * Cada sentencia va en su propio batch, así CREATE SCHEMA puede ir sola.
 */
export async function runSql(sequelize, statements) {
  await sequelize.transaction(async (transaction) => {
    for (const sql of statements) {
      await sequelize.query(sql, { transaction })
    }
  })
}
