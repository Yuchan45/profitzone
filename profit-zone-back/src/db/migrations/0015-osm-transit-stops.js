import { runSql } from '../runSql.js'

// Paradas de colectivo y estaciones de subte y tren de OpenStreetMap, para el indicador
// de accesibilidad y su capa del mapa. Se cargan con `npm run db:seed:osm-transit`.
// `lines`: líneas que paran ahí, separadas por coma (colectivo "39,55,151", subte "D",
// tren "San Martín"). is_active = 0 cuando una parada dejó de aparecer en OSM.
export async function up({ sequelize }) {
  await runSql(sequelize, [
    `CREATE TABLE osm_data.transit_stops (
      id int IDENTITY(1,1) NOT NULL,
      osm_type char(1) NOT NULL,
      osm_id bigint NOT NULL,
      kind varchar(10) NOT NULL,
      name nvarchar(200) NULL,
      lines nvarchar(400) NULL,
      geom geography NOT NULL,
      is_active bit NOT NULL CONSTRAINT DF_transit_stops_is_active DEFAULT 1,
      last_seen_at datetime2 NOT NULL,
      created_at datetime2 NOT NULL CONSTRAINT DF_transit_stops_created_at DEFAULT SYSUTCDATETIME(),
      CONSTRAINT PK_transit_stops PRIMARY KEY (id),
      CONSTRAINT UQ_transit_stops_osm UNIQUE (osm_type, osm_id),
      CONSTRAINT CK_transit_stops_osm_type CHECK (osm_type IN ('n', 'w', 'r')),
      CONSTRAINT CK_transit_stops_kind CHECK (kind IN ('bus', 'subway', 'train'))
    )`,

    `CREATE SPATIAL INDEX IX_transit_stops_geom
     ON osm_data.transit_stops (geom)
     USING GEOGRAPHY_AUTO_GRID`,
  ])
}

export async function down({ sequelize }) {
  await runSql(sequelize, ['DROP TABLE osm_data.transit_stops'])
}
