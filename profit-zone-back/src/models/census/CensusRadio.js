import { DataTypes } from 'sequelize'
import { sequelize } from '../../db/sequelize.js'

export const CensusRadio = sequelize.define(
  'CensusRadio',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    radioId: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    barrio: { type: DataTypes.STRING(100), allowNull: false },
    comuna: { type: DataTypes.INTEGER, allowNull: false },
    poblacion: { type: DataTypes.INTEGER, allowNull: false },
    viviendas: { type: DataTypes.INTEGER, allowNull: false },
    hogares: { type: DataTypes.INTEGER, allowNull: false },
    hogaresNbi: { type: DataTypes.INTEGER, allowNull: false },
    areaKm2: { type: DataTypes.DECIMAL(12, 6), allowNull: false },
    // La geometría se almacena en el tipo nativo geography de SQL Server
    geom: { type: DataTypes.GEOGRAPHY, allowNull: false },
  },
  {
    schema: 'census_data',
    tableName: 'census_radios',
    timestamps: true,
    updatedAt: false,
    createdAt: 'created_at',
  },
)
