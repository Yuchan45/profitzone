import { runSql } from '../runSql.js'

export async function up({ sequelize }) {
  await runSql(sequelize, [
    // 1. Crear el esquema dedicado census_data
    `IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'census_data')
       EXEC('CREATE SCHEMA [census_data]')`,

    // 2. Crear tabla de radios censales
    `CREATE TABLE census_data.census_radios (
      id int IDENTITY(1,1) NOT NULL,
      radio_id varchar(20) NOT NULL,
      barrio nvarchar(100) NOT NULL,
      comuna int NOT NULL,
      poblacion int NOT NULL,
      viviendas int NOT NULL,
      hogares int NOT NULL,
      hogares_nbi int NOT NULL,
      area_km2 decimal(12, 6) NOT NULL,
      geom geography NOT NULL,
      created_at datetime2 NOT NULL CONSTRAINT DF_census_radios_created_at DEFAULT SYSUTCDATETIME(),
      CONSTRAINT PK_census_radios PRIMARY KEY (id),
      CONSTRAINT UQ_census_radios_radio_id UNIQUE (radio_id)
    )`,

    // 3. Crear índice espacial para búsquedas en tiempo récord (STIntersects / STBuffer)
    `CREATE SPATIAL INDEX IX_census_radios_geom
     ON census_data.census_radios (geom)
     USING GEOGRAPHY_AUTO_GRID`,
  ])
}

export async function down({ sequelize }) {
  await runSql(sequelize, [
    'DROP TABLE census_data.census_radios',
    'DROP SCHEMA [census_data]',
  ])
}
