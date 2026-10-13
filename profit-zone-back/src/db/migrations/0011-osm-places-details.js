import { runSql } from '../runSql.js'

// Datos de la ficha del local (dirección, horarios, contacto, servicios) tal como
// vienen de OpenStreetMap, en JSON: cada local tiene un subconjunto distinto.
export async function up({ sequelize }) {
  await runSql(sequelize, [
    'ALTER TABLE osm_data.places ADD details nvarchar(max) NULL',
    `ALTER TABLE osm_data.places ADD CONSTRAINT CK_places_details_json
      CHECK (details IS NULL OR ISJSON(details) = 1)`,
  ])
}

export async function down({ sequelize }) {
  await runSql(sequelize, [
    'ALTER TABLE osm_data.places DROP CONSTRAINT CK_places_details_json',
    'ALTER TABLE osm_data.places DROP COLUMN details',
  ])
}
