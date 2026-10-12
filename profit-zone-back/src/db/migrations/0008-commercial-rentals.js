import { runSql } from '../runSql.js'

export async function up({ sequelize }) {
  await runSql(sequelize, [
    // 1. Crear el esquema comercial_data
    `IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'commercial_data')
       EXEC('CREATE SCHEMA [commercial_data]')`,

    // 2. Crear tabla de locales comerciales en alquiler
    `CREATE TABLE commercial_data.commercial_rentals (
      id int IDENTITY(1,1) NOT NULL,
      source_id varchar(50) NOT NULL,
      operation_type varchar(50) NOT NULL,
      address nvarchar(255) NULL,
      normalized_address nvarchar(255) NULL,
      neighborhood nvarchar(100) NULL,
      sub_neighborhood nvarchar(100) NULL,
      currency_original varchar(10) NULL,
      price_raw decimal(14, 2) NULL,
      price_ars decimal(14, 2) NULL,
      price_usd decimal(14, 2) NULL,
      expensas decimal(14, 2) NULL,
      surface_m2 decimal(10, 2) NULL,
      price_per_m2_ars decimal(14, 2) NULL,
      price_per_m2_usd decimal(14, 2) NULL,
      url nvarchar(500) NULL,
      location_precision varchar(50) NULL,
      geocoding_source varchar(50) NULL,
      geom geography NOT NULL,
      created_at datetime2 NOT NULL CONSTRAINT DF_commercial_rentals_created_at DEFAULT SYSUTCDATETIME(),
      CONSTRAINT PK_commercial_rentals PRIMARY KEY (id),
      CONSTRAINT UQ_commercial_rentals_source_id UNIQUE (source_id)
    )`,

    // 3. Crear índice espacial para búsquedas en tiempo récord (STIntersects / STBuffer)
    `CREATE SPATIAL INDEX IX_commercial_rentals_geom
     ON commercial_data.commercial_rentals (geom)
     USING GEOGRAPHY_AUTO_GRID`,
  ])
}

export async function down({ sequelize }) {
  await runSql(sequelize, [
    'DROP TABLE commercial_data.commercial_rentals',
    'DROP SCHEMA [commercial_data]',
  ])
}
