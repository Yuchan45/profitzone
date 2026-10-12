import { DataTypes, Sequelize } from 'sequelize'

/**
 * PK uniqueidentifier generada por SQL Server con NEWSEQUENTIALID().
 * Sequelize mandaría NULL si el id no tiene valor: el literal DEFAULT hace que
 * el INSERT use el default de la columna, y OUTPUT INSERTED devuelve el id.
 */
export const sequentialUuidPk = {
  type: DataTypes.UUID,
  primaryKey: true,
  defaultValue: Sequelize.literal('DEFAULT'),
}
