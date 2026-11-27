import { runSql } from '../runSql.js'

// Índices para consultas frecuentes de análisis por usuario, lugares/paradas activos,
// barrios censales y limpieza de tokens vencidos.
export async function up({ sequelize }) {
  await runSql(sequelize, [
    `IF NOT EXISTS (
       SELECT 1 FROM sys.indexes
       WHERE name = N'IX_analyses_user_status_updated' AND object_id = OBJECT_ID(N'analysis.analyses')
     )
     CREATE INDEX IX_analyses_user_status_updated
       ON analysis.analyses (user_id, status, updated_at DESC)`,

    `IF NOT EXISTS (
       SELECT 1 FROM sys.indexes
       WHERE name = N'IX_places_active_kind' AND object_id = OBJECT_ID(N'osm_data.places')
     )
     CREATE INDEX IX_places_active_kind
       ON osm_data.places (is_active, kind)`,

    `IF NOT EXISTS (
       SELECT 1 FROM sys.indexes
       WHERE name = N'IX_transit_stops_active' AND object_id = OBJECT_ID(N'osm_data.transit_stops')
     )
     CREATE INDEX IX_transit_stops_active
       ON osm_data.transit_stops (is_active)`,

    `IF NOT EXISTS (
       SELECT 1 FROM sys.indexes
       WHERE name = N'IX_census_radios_barrio' AND object_id = OBJECT_ID(N'census_data.census_radios')
     )
     CREATE INDEX IX_census_radios_barrio
       ON census_data.census_radios (barrio)`,

    `IF NOT EXISTS (
       SELECT 1 FROM sys.indexes
       WHERE name = N'IX_auth_tokens_expires_at' AND object_id = OBJECT_ID(N'users.auth_tokens')
     )
     CREATE INDEX IX_auth_tokens_expires_at
       ON users.auth_tokens (expires_at)`,
  ])
}

export async function down({ sequelize }) {
  await runSql(sequelize, [
    'DROP INDEX IF EXISTS IX_auth_tokens_expires_at ON users.auth_tokens',
    'DROP INDEX IF EXISTS IX_census_radios_barrio ON census_data.census_radios',
    'DROP INDEX IF EXISTS IX_transit_stops_active ON osm_data.transit_stops',
    'DROP INDEX IF EXISTS IX_places_active_kind ON osm_data.places',
    'DROP INDEX IF EXISTS IX_analyses_user_status_updated ON analysis.analyses',
  ])
}
