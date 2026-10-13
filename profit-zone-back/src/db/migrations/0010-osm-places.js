import { runSql } from '../runSql.js'

// Negocios de OpenStreetMap (restaurantes, cafés, gimnasios y pilates) para la
// vista previa de competencia del paso 3. Se cargan con `npm run db:seed:osm-places`.
// is_active = 0 cuando un negocio dejó de aparecer en OSM (el seed no borra filas).
export async function up({ sequelize }) {
  await runSql(sequelize, [
    `IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'osm_data')
       EXEC('CREATE SCHEMA [osm_data]')`,

    `CREATE TABLE osm_data.places (
      id int IDENTITY(1,1) NOT NULL,
      osm_type char(1) NOT NULL,
      osm_id bigint NOT NULL,
      kind varchar(20) NOT NULL,
      name nvarchar(200) NULL,
      cuisine varchar(200) NULL,
      geom geography NOT NULL,
      is_active bit NOT NULL CONSTRAINT DF_places_is_active DEFAULT 1,
      last_seen_at datetime2 NOT NULL,
      created_at datetime2 NOT NULL CONSTRAINT DF_places_created_at DEFAULT SYSUTCDATETIME(),
      CONSTRAINT PK_places PRIMARY KEY (id),
      CONSTRAINT UQ_places_osm UNIQUE (osm_type, osm_id),
      CONSTRAINT CK_places_osm_type CHECK (osm_type IN ('n', 'w', 'r')),
      CONSTRAINT CK_places_kind CHECK (kind IN ('restaurant', 'fast_food', 'cafe', 'fitness', 'pilates'))
    )`,

    `CREATE SPATIAL INDEX IX_places_geom
     ON osm_data.places (geom)
     USING GEOGRAPHY_AUTO_GRID`,
  ])
}

export async function down({ sequelize }) {
  await runSql(sequelize, ['DROP TABLE osm_data.places', 'DROP SCHEMA [osm_data]'])
}
