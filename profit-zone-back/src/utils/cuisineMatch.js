// Cuándo un local de OpenStreetMap es competencia directa según la cocina elegida.
// En Palermo más de la mitad de los restaurantes de OSM no tiene la etiqueta `cuisine`:
// si falta, el nombre suele delatar la cocina ("Sushi Club", "Ramen House").

// Palabras del nombre (ya normalizado: minúsculas, sin tildes) que indican cada cocina.
// La clave es un valor de `osmCuisine` de la opción (catalog.js): si la opción lo incluye,
// se usa ese patrón. Las palabras cortas van con \b para no pegarle a otras ("cochino").
const NAME_PATTERNS = {
  asian:
    /(sushi|nikkei|ramen|\bwok\b|asian|asiatic|japon|japanese|\bchin[ao]s?\b|corean|korean|\bthai|vietnam|\bpoke\b|omakase|izakaya|\bbao\b|dim sum|dumpling|teppan|yakitori|\budon\b|\bpho\b|taiwan|oriental)/,
  steak_house: /(parrill|asador|steak|\bcarnes?\b|grill|\bbife|costillar)/,
  italian: /(pizz|\bpastas?\b|italian|trattoria|osteria)/,
  international: /(\bautor\b|fusion|internacional|bistro|gourmet)/,
}

/** Minúsculas, sin tildes ni signos: "Ñoquis & Co." → "noquis co". */
export function normalizeName(name) {
  return (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Si el nombre indica alguna de las cocinas buscadas (`cuisines`: Set de valores de OSM). */
export function nameMatchesCuisine(name, cuisines) {
  const normalized = normalizeName(name)
  if (!normalized) return false
  return Object.entries(NAME_PATTERNS).some(([cuisine, pattern]) => cuisines.has(cuisine) && pattern.test(normalized))
}

/**
 * Si un local de OSM es competencia directa: por su etiqueta `cuisine` (puede traer
 * varias separadas por ";") o, si no la tiene, por su nombre. `criteria` es el de
 * directCriteria (places.service): sin criterio, nada es directo.
 */
export function isDirectOsmPlace(criteria, { cuisine, name }) {
  if (!criteria) return false
  if (cuisine) return cuisine.split(';').some((value) => criteria.cuisines.has(value.trim()))
  return nameMatchesCuisine(name, criteria.cuisines)
}
