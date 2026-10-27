import { runSql } from '../runSql.js'

// Lugares de OpenStreetMap que atraen a cada público (escuelas, universidades,
// oficinas, centros de jubilados...) para el criterio "Según tu público" del
// reporte (PZ-50). Se cargan con `npm run db:seed:osm-audience`. Van aparte de
// osm_data.places: cada seed desactiva lo que no vio en su corrida.
export async function up({ sequelize }) {
  await runSql(sequelize, [
    `CREATE TABLE osm_data.audience_places (
      id int IDENTITY(1,1) NOT NULL,
      osm_type char(1) NOT NULL,
      osm_id bigint NOT NULL,
      kind varchar(20) NOT NULL,
      name nvarchar(200) NULL,
      geom geography NOT NULL,
      is_active bit NOT NULL CONSTRAINT DF_audience_places_is_active DEFAULT 1,
      last_seen_at datetime2 NOT NULL,
      created_at datetime2 NOT NULL CONSTRAINT DF_audience_places_created_at DEFAULT SYSUTCDATETIME(),
      CONSTRAINT PK_audience_places PRIMARY KEY (id),
      CONSTRAINT UQ_audience_places_osm UNIQUE (osm_type, osm_id),
      CONSTRAINT CK_audience_places_osm_type CHECK (osm_type IN ('n', 'w', 'r')),
      CONSTRAINT CK_audience_places_kind CHECK (kind IN (
        'kindergarten', 'school', 'playground', 'university', 'office', 'coworking', 'senior_center', 'healthcare'
      ))
    )`,

    `CREATE SPATIAL INDEX IX_audience_places_geom
     ON osm_data.audience_places (geom)
     USING GEOGRAPHY_AUTO_GRID`,
  ])
}

export async function down({ sequelize }) {
  await runSql(sequelize, ['DROP TABLE osm_data.audience_places'])
}
