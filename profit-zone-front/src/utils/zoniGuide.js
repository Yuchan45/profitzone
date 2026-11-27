// Guía de Zoni: cómo funciona ProfitZone en tres pasos y qué conviene preguntar en cada pantalla.

export const HOW_IT_WORKS = [
  { title: 'Contanos tu negocio', text: 'Elegí el rubro y respondé unas preguntas cortas.' },
  { title: 'Marcá la zona', text: 'Un punto y un radio en el mapa de Palermo.' },
  { title: 'Leé el reporte', text: 'Competencia, afluencia, población, alquiler y transporte, cruzados con tu perfil.' },
]

// Pantallas del sitio: nombre para mostrar y preguntas sugeridas. Va de la más específica a la más general.
const SCREENS = [
  {
    match: /^\/(analizar\/(analisis|reporte)|mis-reportes)\/[^/]+$|^\/reporte-ejemplo$/,
    label: 'un reporte de zona',
    suggestions: [
      'Explicame este reporte en simple',
      '¿Cuáles son las debilidades de esta zona?',
      '¿Qué debería validar antes de alquilar?',
      '¿Cómo se compara con el resto de Palermo?',
    ],
  },
  {
    match: /^\/analizar\/rubro/,
    label: 'el paso 1: rubro',
    suggestions: ['¿Qué rubros puedo analizar?', '¿Cómo sigue el análisis?', '¿Cuánto cuesta un análisis?'],
  },
  {
    match: /^\/analizar\/negocio/,
    label: 'el paso 2: tu negocio',
    suggestions: [
      '¿Para qué sirven estas preguntas?',
      '¿Qué pasa si no sé una respuesta?',
      '¿Cómo sigue el análisis?',
    ],
  },
  {
    match: /^\/analizar\/ubicacion/,
    label: 'el paso 3: ubicación',
    suggestions: [
      '¿Qué radio me conviene elegir?',
      '¿Qué diferencia hay entre el básico y el completo?',
      '¿Qué son los puntos del mapa?',
    ],
  },
  {
    match: /^\/creditos/,
    label: 'créditos',
    suggestions: [
      '¿Qué pack me conviene?',
      '¿Qué incluye el análisis completo?',
      '¿Los créditos vencen?',
    ],
  },
  {
    match: /^\/mis-reportes$/,
    label: 'Mis reportes',
    suggestions: [
      '¿Por qué un reporte está bloqueado?',
      '¿Cómo mejoro un análisis a completo?',
      '¿Cómo hago un análisis nuevo?',
    ],
  },
  {
    match: /^\/metodologia/,
    label: 'la metodología',
    suggestions: ['¿De dónde salen los datos?', '¿Cómo calculan la afluencia?', '¿Qué es el percentil de Palermo?'],
  },
  {
    match: /^\/tramites/,
    label: 'trámites y habilitaciones',
    suggestions: ['¿Qué habilitación necesito?', '¿Por dónde empiezo los trámites?'],
  },
  {
    match: /.*/,
    label: null,
    suggestions: [
      '¿Cómo funciona ProfitZone?',
      '¿Cómo funcionan los créditos?',
      '¿De dónde salen los datos?',
      '¿Qué rubros y zonas cubren?',
    ],
  },
]

function screenFor(pathname) {
  return SCREENS.find((screen) => screen.match.test(pathname))
}

/** Nombre de la pantalla para mostrarle al usuario ("Estás en …"); null si no hace falta. */
export function screenLabel(pathname) {
  return screenFor(pathname).label
}

/** Preguntas sugeridas para la pantalla, sin las que ya se hicieron. */
export function suggestionsFor(pathname, asked = []) {
  const done = new Set(asked.map((question) => question.trim().toLowerCase()))
  return screenFor(pathname).suggestions.filter((suggestion) => !done.has(suggestion.toLowerCase()))
}
