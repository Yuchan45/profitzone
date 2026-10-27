// Lugares que atraen a cada público de "¿A qué público apuntás?" (pregunta
// target_age del catálogo) (PZ-50). Acá está qué tipos de lugar atraen a cada
// público: lo usan el servicio (qué se cuenta en el radio) y el criterio "Según tu
// público" del reporte. Qué etiquetas de OSM son cada tipo lo decide el seed
// (classifyAudiencePlace en db/seeders/osmAudiencePlaces.js).

// Tipos de lugar de osm_data.audience_places (columna `kind`), en el orden en que se muestran
export const AUDIENCE_PLACE_KINDS = {
  kindergarten: { singular: 'jardín de infantes', plural: 'jardines de infantes' },
  school: { singular: 'escuela', plural: 'escuelas' },
  playground: { singular: 'plaza de juegos', plural: 'plazas de juegos' },
  university: { singular: 'universidad o instituto', plural: 'universidades e institutos' },
  office: { singular: 'oficina', plural: 'oficinas' },
  coworking: { singular: 'coworking', plural: 'coworkings' },
  senior_center: { singular: 'centro de jubilados', plural: 'centros de jubilados' },
  healthcare: { singular: 'centro de salud', plural: 'centros de salud' },
}

// Opción de target_age → tipos de lugar que suelen reunir a ese público
export const ATTRACTORS_BY_AUDIENCE = {
  kids: ['kindergarten', 'school', 'playground'],
  young: ['university'],
  adults: ['office', 'coworking'],
  seniors: ['senior_center', 'healthcare'],
}

/** Tipos de lugar (sin repetir, en el orden de AUDIENCE_PLACE_KINDS) para los públicos elegidos. */
export function kindsForAudiences(audiences) {
  const wanted = new Set(audiences.flatMap((code) => ATTRACTORS_BY_AUDIENCE[code] ?? []))
  return Object.keys(AUDIENCE_PLACE_KINDS).filter((kind) => wanted.has(kind))
}

/** "1 escuela" / "3 escuelas". */
export function describeKindCount(kind, count) {
  const labels = AUDIENCE_PLACE_KINDS[kind]
  return `${count.toLocaleString('es-AR')} ${count === 1 ? labels.singular : labels.plural}`
}
