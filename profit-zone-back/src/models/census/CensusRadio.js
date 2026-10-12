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
    edad0a14: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'edad_0_14' },
    edad15a34: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'edad_15_34' },
    edad35a59: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'edad_35_59' },
    edad60Mas: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'edad_60_mas' },
    mujeres: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    varones: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
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
