import { searchNearbyPlaces } from './googlePlaces.service.js'
import { calculateDistanceMeters, formatDistance } from '../utils/geo.js'

const TRANSIT_TYPES = [
  'subway_station',
  'bus_stop',
  'train_station',
  'bus_station',
  'transit_station',
  'light_rail_station',
]

const CATEGORY_LABELS = {
  subway: 'Subte',
  train: 'Tren',
  bus: 'Colectivo',
  other: 'Transporte',
}

const NEIGHBORHOOD_NAMES = new Set([
  'agronomía', 'almagro', 'balvanera', 'barrancas', 'barracas', 'belgrano', 'boedo',
  'caballito', 'caba', 'chacarita', 'coghlan', 'colegiales', 'constitución', 'flores',
  'floresta', 'la boca', 'liniers', 'mataderos', 'monte castro', 'monserrat',
  'nueva pompeya', 'núñez', 'palermo', 'parque avellaneda', 'parque chacabuco',
  'parque chas', 'parque patricios', 'patronato', 'paternal', 'puerto madero',
  'recoleta', 'retiro', 'saavedra', 'san cristóbal', 'san nicolás', 'san telmo',
  'vélez sársfield', 'versalles', 'villa crespo', 'villa del parque', 'villa devoto',
  'villa general mitre', 'villa lugano', 'villa luro', 'villa ortúzar', 'villa pueyrredón',
  'villa real', 'villa riachuelo', 'villa santa rita', 'villa soldati', 'villa urquiza',
])

// Estaciones de subte de Buenos Aires (Líneas A, B, C, D, E, H)
const KNOWN_SUBWAY_STATIONS = [
  // Línea A
  { key: 'plaza-de-mayo', match: /plaza de mayo/i, name: 'Est. Plaza de Mayo', line: 'Línea A', street: 'Balcarce e Hipólito Yrigoyen' },
  { key: 'peru', match: /\bper[uú]\b/i, name: 'Est. Perú', line: 'Línea A', street: 'Av. de Mayo y Perú' },
  { key: 'piedras', match: /piedras/i, name: 'Est. Piedras', line: 'Línea A', street: 'Av. de Mayo y Piedras' },
  { key: 'lima', match: /\blima\b/i, name: 'Est. Lima', line: 'Línea A', street: 'Av. de Mayo y Lima' },
  { key: 'saenz-pena', match: /s[aá]enz pe[nñ]a/i, name: 'Est. Sáenz Peña', line: 'Línea A', street: 'Av. de Mayo y Sáenz Peña' },
  { key: 'congreso-a', match: /^congreso$/i, name: 'Est. Congreso', line: 'Línea A', street: 'Av. Rivadavia y Av. Callao' },
  { key: 'pasco', match: /pasco/i, name: 'Est. Pasco', line: 'Línea A', street: 'Av. Rivadavia y Pasco' },
  { key: 'alberti', match: /alberti/i, name: 'Est. Alberti', line: 'Línea A', street: 'Av. Rivadavia y Alberti' },
  { key: 'miserere', match: /miserere/i, name: 'Est. Plaza Miserere', line: 'Línea A', street: 'Av. Rivadavia y Av. Pueyrredón' },
  { key: 'loria', match: /loria/i, name: 'Est. Loria', line: 'Línea A', street: 'Av. Rivadavia y Sánchez de Loria' },
  { key: 'castro-barros', match: /castro barros/i, name: 'Est. Castro Barros', line: 'Línea A', street: 'Av. Rivadavia y Castro Barros' },
  { key: 'rio-de-janeiro', match: /r[ií]o de janeiro/i, name: 'Est. Río de Janeiro', line: 'Línea A', street: 'Av. Rivadavia y Río de Janeiro' },
  { key: 'acoyte', match: /acoyte/i, name: 'Est. Acoyte', line: 'Línea A', street: 'Av. Rivadavia y Acoyte' },
  { key: 'primera-junta', match: /primera junta/i, name: 'Est. Primera Junta', line: 'Línea A', street: 'Av. Rivadavia y Del Barco Centenera' },

  // Línea B
  { key: 'alem', match: /leandro n\.? alem|\balem\b/i, name: 'Est. Leandro N. Alem', line: 'Línea B', street: 'Av. Corrientes y Av. Leandro N. Alem' },
  { key: 'florida', match: /florida/i, name: 'Est. Florida', line: 'Línea B', street: 'Av. Corrientes y Florida' },
  { key: 'carlos-pellegrini', match: /carlos pellegrini/i, name: 'Est. Carlos Pellegrini', line: 'Línea B', street: 'Av. Corrientes y Carlos Pellegrini' },
  { key: 'uruguay', match: /uruguay/i, name: 'Est. Uruguay', line: 'Línea B', street: 'Av. Corrientes y Uruguay' },
  { key: 'callao-b', match: /callao.*bravo|callao.*\bb\b/i, name: 'Est. Callao', line: 'Línea B', street: 'Av. Corrientes y Av. Callao' },
  { key: 'pasteur', match: /pasteur/i, name: 'Est. Pasteur - AMIA', line: 'Línea B', street: 'Av. Corrientes y Pasteur' },
  { key: 'carlos-gardel', match: /carlos gardel/i, name: 'Est. Carlos Gardel', line: 'Línea B', street: 'Av. Corrientes y Agüero' },
  { key: 'medrano', match: /medrano/i, name: 'Est. Medrano', line: 'Línea B', street: 'Av. Corrientes y Av. Medrano' },
  { key: 'angel-gallardo', match: /[aá]ngel gallardo/i, name: 'Est. Ángel Gallardo', line: 'Línea B', street: 'Av. Corrientes y Av. Ángel Gallardo' },
  { key: 'malabia', match: /malabia/i, name: 'Est. Malabia', line: 'Línea B', street: 'Av. Corrientes y Malabia' },
  { key: 'dorrego', match: /dorrego/i, name: 'Est. Dorrego', line: 'Línea B', street: 'Av. Corrientes y Av. Dorrego' },
  { key: 'lacroze-b', match: /federico lacroze|lacroze/i, name: 'Est. Federico Lacroze', line: 'Línea B', street: 'Av. Corrientes y Av. Federico Lacroze' },

  // Línea C
  { key: 'retiro-c', match: /retiro/i, name: 'Est. Retiro', line: 'Línea C', street: 'Av. Ramos Mejía y Av. del Libertador' },
  { key: 'san-martin', match: /san mart[ií]n/i, name: 'Est. Gral. San Martín', line: 'Línea C', street: 'Av. Santa Fe y Esmeralda' },
  { key: 'lavalle', match: /lavalle/i, name: 'Est. Lavalle', line: 'Línea C', street: 'Esmeralda y Lavalle' },
  { key: 'diagonal-norte', match: /diagonal norte/i, name: 'Est. Diagonal Norte', line: 'Línea C', street: 'Sarmiento y Carlos Pellegrini' },
  { key: 'av-de-mayo', match: /avenida de mayo/i, name: 'Est. Av. de Mayo', line: 'Línea C', street: 'Av. de Mayo y Bernardo de Irigoyen' },
  { key: 'moreno', match: /moreno/i, name: 'Est. Moreno', line: 'Línea C', street: 'Bernardo de Irigoyen y Moreno' },
  { key: 'independencia', match: /independencia/i, name: 'Est. Independencia', line: 'Línea C / E', street: 'Bernardo de Irigoyen y Av. Independencia' },
  { key: 'constitucion-c', match: /constituci[oó]n/i, name: 'Est. Constitución', line: 'Línea C', street: 'Lima y Av. Brasil' },

  // Línea D
  { key: 'catedral', match: /catedral/i, name: 'Est. Catedral', line: 'Línea D', street: 'San Martín y Av. Roque Sáenz Peña' },
  { key: '9-de-julio', match: /9 de julio/i, name: 'Est. 9 de Julio', line: 'Línea D', street: 'Carlos Pellegrini y Sarmiento' },
  { key: 'tribunales', match: /tribunales/i, name: 'Est. Tribunales', line: 'Línea D', street: 'Talcahuano y Tucumán' },
  { key: 'callao-d', match: /callao/i, name: 'Est. Callao', line: 'Línea D', street: 'Av. Córdoba y Av. Callao' },
  { key: 'facultad-medicina', match: /facultad de medicina/i, name: 'Est. Facultad de Medicina', line: 'Línea D', street: 'Av. Córdoba y Pres. José E. Uriburu' },
  { key: 'pueyrredon-d', match: /pueyrred[oó]n/i, name: 'Est. Pueyrredón', line: 'Línea D', street: 'Av. Santa Fe y Av. Pueyrredón' },
  { key: 'aguero', match: /ag[uü]ero/i, name: 'Est. Agüero', line: 'Línea D', street: 'Av. Santa Fe y Agüero' },
  { key: 'bulnes', match: /bulnes/i, name: 'Est. Bulnes', line: 'Línea D', street: 'Av. Santa Fe y Bulnes' },
  { key: 'scalabrini-ortiz', match: /scalabrini ortiz/i, name: 'Est. Scalabrini Ortiz', line: 'Línea D', street: 'Av. Santa Fe y Av. Scalabrini Ortiz' },
  { key: 'plaza-italia', match: /plaza italia/i, name: 'Est. Plaza Italia', line: 'Línea D', street: 'Av. Santa Fe y Av. Sarmiento' },
  { key: 'palermo-d', match: /palermo/i, name: 'Est. Palermo', line: 'Línea D', street: 'Av. Santa Fe y Av. Juan B. Justo' },
  { key: 'carranza-d', match: /carranza/i, name: 'Est. Ministro Carranza', line: 'Línea D', street: 'Av. Santa Fe y Av. Dorrego' },
  { key: 'olleros', match: /olleros/i, name: 'Est. Olleros', line: 'Línea D', street: 'Av. Cabildo y Olleros' },
  { key: 'jose-hernandez', match: /jos[eé] hern[aá]ndez/i, name: 'Est. José Hernández', line: 'Línea D', street: 'Av. Cabildo y Virrey del Pino' },
  { key: 'juramento', match: /juramento/i, name: 'Est. Juramento', line: 'Línea D', street: 'Av. Cabildo y Juramento' },
  { key: 'congreso-tucuman', match: /congreso de tucum[aá]n/i, name: 'Est. Congreso de Tucumán', line: 'Línea D', street: 'Av. Cabildo y Av. Congreso' },

  // Línea H
  { key: 'facultad-derecho', match: /facultad de derecho/i, name: 'Est. Facultad de Derecho', line: 'Línea H', street: 'Av. Figueroa Alcorta y Av. Pueyrredón' },
  { key: 'las-heras', match: /las heras/i, name: 'Est. Las Heras', line: 'Línea H', street: 'Av. Las Heras y Av. Pueyrredón' },
  { key: 'santa-fe-h', match: /santa fe|ja[uú]regui/i, name: 'Est. Santa Fe - Carlos Jáuregui', line: 'Línea H', street: 'Av. Santa Fe y Av. Pueyrredón' },
  { key: 'cordoba-h', match: /c[oó]rdoba/i, name: 'Est. Córdoba', line: 'Línea H', street: 'Av. Córdoba y Av. Pueyrredón' },
  { key: 'corrientes-h', match: /corrientes/i, name: 'Est. Corrientes', line: 'Línea H', street: 'Av. Corrientes y Av. Pueyrredón' },
  { key: 'once-h', match: /once|30 de diciembre/i, name: 'Est. Once', line: 'Línea H', street: 'Av. Pueyrredón y Av. Rivadavia' },
]

// Estaciones de tren metropolitano en CABA (diferenciadas de la red de subte)
const KNOWN_TRAIN_STATIONS = [
  { key: 'tren-palermo', match: /palermo/i, name: 'Est. Palermo', line: 'Línea San Martín', street: 'Av. Santa Fe y Av. Juan B. Justo' },
  { key: 'tren-carranza', match: /carranza/i, name: 'Est. Ministro Carranza', line: 'Línea Mitre', street: 'Av. Santa Fe y Av. Dorrego' },
  { key: 'tren-3-de-febrero', match: /3 de febrero|tres de febrero/i, name: 'Est. Tres de Febrero', line: 'Línea Mitre', street: 'Av. Dorrego y Av. Figueroa Alcorta' },
  { key: 'tren-lisandro-torre', match: /lisandro de la torre/i, name: 'Est. Lisandro de la Torre', line: 'Línea Mitre', street: 'Av. Olleros y Av. del Libertador' },
  { key: 'tren-colegiales', match: /colegiales/i, name: 'Est. Colegiales', line: 'Línea Mitre', street: 'Av. Federico Lacroze y Moldes' },
  { key: 'tren-belgrano-c', match: /belgrano c/i, name: 'Est. Belgrano C', line: 'Línea Mitre', street: 'Av. Virrey Vértiz y Juramento' },
  { key: 'tren-belgrano-r', match: /belgrano r/i, name: 'Est. Belgrano R', line: 'Línea Mitre', street: 'Juramento y Zapiola' },
  { key: 'tren-saldias', match: /sald[ií]as/i, name: 'Est. Saldías', line: 'Línea Belgrano Norte', street: 'Av. Figueroa Alcorta y San Martín de Tours' },
  { key: 'tren-ciudad-univ', match: /ciudad universitaria/i, name: 'Est. Ciudad Universitaria', line: 'Línea Belgrano Norte', street: 'Av. Udaondo y Av. Cantilo' },
  { key: 'tren-retiro', match: /retiro/i, name: 'Est. Retiro', line: 'Líneas Mitre, San Martín y Belgrano', street: 'Av. Dr. José María Ramos Mejía 1400' },
  { key: 'tren-lacroze', match: /lacroze/i, name: 'Est. Federico Lacroze', line: 'Línea Urquiza', street: 'Av. Corrientes y Av. Federico Lacroze' },
  { key: 'tren-villa-crespo', match: /villa crespo|chacarita/i, name: 'Est. Villa Crespo', line: 'Línea San Martín', street: 'Av. Corrientes y Av. Dorrego' },
  { key: 'tren-once', match: /once/i, name: 'Est. Once', line: 'Línea Sarmiento', street: 'Av. Pueyrredón y Bartolomé Mitre' },
  { key: 'tren-constitucion', match: /constituci[oó]n/i, name: 'Est. Constitución', line: 'Línea Roca', street: 'Av. Brasil 1128' },
]

// Corredores de colectivo en Palermo y CABA para paradas cuyo nombre en Google Places solo indica la calle
const BUS_CORRIDOR_LINES = [
  { match: /pac[ií]fico/i, lines: 'Líneas 12, 15, 29, 34, 39, 60, 68, 152, 166' },
  { match: /plaza italia/i, lines: 'Líneas 12, 15, 29, 39, 57, 59, 60, 68, 152' },
  { match: /bullrich|juan b\.? justo/i, lines: 'Líneas 34, 55, 108, 166' },
  { match: /cervi[nñ]o/i, lines: 'Líneas 37, 59, 60, 93, 108' },
  { match: /santa mar[ií]a de oro|\boro\b/i, lines: 'Líneas 41, 68, 93, 152' },
  { match: /santa fe|sta\.? fe/i, lines: 'Líneas 12, 15, 29, 39, 60, 64, 68, 111, 152' },
  { match: /sarmiento/i, lines: 'Líneas 10, 37, 59, 60, 160' },
  { match: /las heras/i, lines: 'Líneas 10, 29, 37, 41, 59, 60, 93, 95, 108, 118' },
  { match: /libertador/i, lines: 'Líneas 10, 17, 67, 92, 93, 102, 124, 130' },
  { match: /figueroa alcorta/i, lines: 'Líneas 67, 102, 130' },
  { match: /cabildo/i, lines: 'Líneas 41, 59, 60, 67, 68, 152, 161, 168' },
  { match: /scalabrini ortiz/i, lines: 'Líneas 15, 36, 55, 57, 110, 141, 160' },
  { match: /c[oó]rdoba/i, lines: 'Líneas 19, 39, 90, 93, 106, 109, 111, 140, 151, 168' },
  { match: /coronel d[ií]az/i, lines: 'Líneas 12, 29, 92, 109, 111, 128, 188' },
  { match: /luis mar[ií]a campos/i, lines: 'Líneas 15, 29, 42, 55, 59, 60, 64, 118' },
  { match: /dorrego/i, lines: 'Líneas 39, 42, 93, 108, 151, 168' },
  { match: /pueyrred[oó]n/i, lines: 'Líneas 12, 39, 41, 61, 62, 64, 68, 95, 111, 118, 152' },
  { match: /callao/i, lines: 'Líneas 12, 24, 26, 37, 60, 102, 124, 150' },
  { match: /corrientes/i, lines: 'Líneas 24, 26, 29, 99, 109, 115, 124, 146, 180' },
  { match: /rivadavia/i, lines: 'Líneas 1, 2, 5, 8, 26, 64, 86, 88, 98, 103, 105, 132' },
  { match: /honduras/i, lines: 'Líneas 39, 55, 93, 108, 111, 140, 151, 168' },
  { match: /gorriti|cabrera/i, lines: 'Líneas 15, 39, 55, 57, 106, 109, 110, 140, 151, 168' },
  { match: /niceto vega/i, lines: 'Líneas 19, 39, 90, 93, 108, 111, 140, 151, 168' },
  { match: /charcas|mansilla|beruti|juncal|arenales|g[uü]emes|ayacucho|french|pe[nñ]a/i, lines: 'Líneas 12, 29, 39, 64, 68, 109, 111, 152' },
  { match: /lavalle|tucum[aá]n|viamonte|jun[ií]n|uriburu/i, lines: 'Líneas 24, 26, 29, 60, 99, 109, 115, 140, 146' },
  { match: /salguero|bulnes|vidt|billinghurst|ag[uü]ero|ecuador|anchorena/i, lines: 'Líneas 29, 41, 68, 92, 110, 128, 188' },
  { match: /thames|serrano|borges|gurruchaga|armenia|malabia|uriarte|godoy cruz|humboldt|fitz roy|bonpland|ravignani|ar[eé]valo/i, lines: 'Líneas 15, 34, 39, 55, 93, 108, 111, 140, 151, 166, 168' },
]

/**
 * Clasifica el tipo de transporte según sus types de Google Places y nombre.
 */
function classifyTransitType(types = [], primaryType = '', name = '') {
  const all = [primaryType, ...types].filter(Boolean)
  if (all.includes('subway_station')) return 'subway'
  if (all.includes('train_station') || all.includes('light_rail_station')) return 'train'
  if (/^estaci[oó]n\s+/i.test(name) && KNOWN_TRAIN_STATIONS.some((s) => s.match.test(name))) {
    return 'train'
  }
  if (/subte/i.test(name)) return 'subway'
  if (all.includes('bus_stop') || all.includes('bus_station')) return 'bus'
  return 'other'
}

/**
 * Extrae números de línea explícitos dentro de cualquier paréntesis del nombre.
 * Ignora paréntesis descriptivos como "(Portal Palermo Shopping)".
 */
function extractExplicitBusLines(name = '') {
  const matches = [...name.matchAll(/\(([^)]+)\)/g)]
  for (const m of matches) {
    const raw = m[1].trim()
    if (/^(?:l[ií]neas?|ramal)\s+/i.test(raw)) {
      return raw
    }
    const parts = raw.split(/[-–,/]/).map((s) => s.trim()).filter(Boolean)
    if (parts.length > 0 && parts.every((n) => /^\d{1,3}[A-Za-z]?$/.test(n))) {
      return parts.length === 1 ? `Línea ${parts[0]}` : `Líneas ${parts.join(', ')}`
    }
  }
  const inlineMatch = name.match(/\bL[ií]neas?\s+(\d{1,3}(?:\s*[,y-]\s*\d{1,3})*)/i)
  if (inlineMatch) {
    return inlineMatch[0]
  }
  return null
}

/**
 * Determina si una parada de colectivo devuelta por Google Places es realmente
 * una parada de transporte público y no un comercio mal categorizado (ej. "Malfitana", "Service Beruti").
 */
function isValidBusStop(name = '') {
  if (!name) return false
  if (/^(?:service|remis|flete|agencia|garage|estacionamiento|taller|kiosco)\b/i.test(name)) {
    return false
  }
  if (extractExplicitBusLines(name)) return true
  if (/\s+[yYeE]\s+/.test(name)) return true
  if (/(?:\bAv\.?|Avenida|Metrobus|C\.?\s*T\.?|Parada|Pac[ií]fico|Plaza Italia|Juan B\.? Justo|\d{3,5})/i.test(name)) {
    return true
  }
  return false
}

/**
 * Normaliza la dirección o calle removiendo sufijos como ", CABA", ", Buenos Aires", ", Argentina", ", BDC".
 */
function cleanAddress(address = '') {
  if (!address) return ''
  return address
    .replace(/,\s*(?:C\d{4}[A-Z]{0,3}\s*)?(?:CABA|Ciudad Aut[oó]noma de Buenos Aires|Buenos Aires|Argentina|BDC).*$/i, '')
    .replace(/,\s*[A-Z]{2,4}$/, '')
    .trim()
}

/**
 * Limpia y formatea el nombre de una calle o esquina proveniente de Google Places.
 */
function formatStreetText(raw = '') {
  if (!raw) return ''
  let text = raw
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/^\d{4,6}\s*[-–]\s*/, '')
    .replace(/^C\.?\s*T\.?\s*Pac[ií]fico\s*[-–]\s*/i, '')
    .replace(/^(?:Parada(?: de colectivos?)?|Estaci[oó]n)\s+/i, '')
    .trim()

  const invertedAv = text.match(/^(\d+)\s+(.+?)\s+(?:Int\.\s*)?(Av\.?|Avenida)$/i)
  if (invertedAv) {
    const [, num, streetName] = invertedAv
    const hasInt = /Int\./i.test(text)
    text = `Av. ${hasInt ? 'Int. ' : ''}${streetName.replace(/\s*Int\.?$/i, '').trim()} ${num}`
  }

  text = text.replace(/,\s*(\d+)-\d+$/, ' $1').replace(/\s+(\d+)-\d+$/, ' $1')

  text = text
    .replace(/\bAvenida\b/gi, 'Av.')
    .replace(/\bSta\.?\s+Fe\b/gi, 'Santa Fe')
    .replace(/\bFray Justo Santa Mar[ií]a De Oro\b/gi, 'Fray Justo Sta. María de Oro')
    .replace(/\s+Y\s+/g, ' y ')
    .replace(/\s+E\s+/g, ' e ')

  if (/^Santa Fe\s+(?:\d+|y\s+)/i.test(text)) {
    text = `Av. ${text}`
  }
  if (/^Sarmiento\s+\d+/i.test(text)) {
    text = `Av. ${text}`
  }

  return text.trim()
}

/**
 * Resuelve los datos normalizados de una estación o parada (nombre, líneas, calle y clave de deduplicación).
 */
function enrichTransitPlace(p) {
  const category = classifyTransitType(p.types, p.primaryType, p.name)
  if (category === 'other') return null
  if (category === 'bus' && !isValidBusStop(p.name)) return null

  if (category === 'subway') {
    const known =
      (/bravo/i.test(p.name) && KNOWN_SUBWAY_STATIONS.find((s) => s.key === 'callao-b')) ||
      KNOWN_SUBWAY_STATIONS.find((s) => s.match.test(p.name))
    const cleanName = known ? known.name : `Est. ${formatStreetText(p.name)}`
    const lineName = extractExplicitBusLines(p.name) || known?.line || 'Subte'
    const lines = `${lineName} (${cleanName})`
    const cleanedAddr = cleanAddress(p.address)
    const isNeighborhood = !cleanedAddr || NEIGHBORHOOD_NAMES.has(cleanedAddr.toLowerCase())
    const street = known?.street || (!isNeighborhood ? cleanedAddr : cleanName)
    const dedupKey = `subway:${known ? known.key : cleanName.toLowerCase()}`
    return { category, cleanName, lines, street, dedupKey }
  }

  if (category === 'train') {
    const known = KNOWN_TRAIN_STATIONS.find((s) => s.match.test(p.name))
    const cleanName = known ? known.name : `Est. ${formatStreetText(p.name)}`
    const lineName = extractExplicitBusLines(p.name) || known?.line || 'Tren'
    const lines = `${lineName} (${cleanName})`
    const cleanedAddr = cleanAddress(p.address)
    const isNeighborhood = !cleanedAddr || NEIGHBORHOOD_NAMES.has(cleanedAddr.toLowerCase())
    const street = known?.street || (!isNeighborhood ? cleanedAddr : cleanName)
    const dedupKey = `train:${known ? known.key : cleanName.toLowerCase()}`
    return { category, cleanName, lines, street, dedupKey }
  }

  // Colectivo (bus)
  const explicitLines = extractExplicitBusLines(p.name)
  const cleanedAddr = cleanAddress(p.address)
  const isNeighborhood = !cleanedAddr || NEIGHBORHOOD_NAMES.has(cleanedAddr.toLowerCase())
  const formattedFromName = formatStreetText(p.name)

  let street = formattedFromName
  if (
    !isNeighborhood &&
    cleanedAddr &&
    (!/\s+y\s+/i.test(formattedFromName) || /^(?:Pac[ií]fico|Plaza Italia|Oro|Juan B\.? Justo)$/i.test(formattedFromName))
  ) {
    street = formatStreetText(cleanedAddr)
  }
  if (/^Metrobus\s*[-–]?\s*Pac[ií]fico$/i.test(formattedFromName) || /^Pac[ií]fico$/i.test(formattedFromName)) {
    street = 'Av. Santa Fe y Av. Juan B. Justo (Metrobus Pacífico)'
  } else if (/^Oro$/i.test(formattedFromName) || /^Av\. Santa Fe y Oro$/i.test(formattedFromName)) {
    street = 'Av. Santa Fe y Fray Justo Sta. María de Oro'
  }

  const corridorSource = `${p.name} ${street}`
  const corridor = BUS_CORRIDOR_LINES.find((c) => c.match.test(corridorSource))
  const lines = explicitLines || corridor?.lines || 'Colectivo urbano'
  const cleanName = street

  // Clave canónica para deduplicar paradas repetidas en la misma esquina, nodo o cuadra
  const normToken = (str) =>
    str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s*\([^)]*\)/g, '')
      .replace(/\b(?:av\.?|avenida|calle|int\.?|gral\.?|fray|justo|sta\.?|santa\s+maria\s+de|maria|de|del|la|el|los|las|metrobus|pacifico)\b/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

  let dedupKey
  if (/pac[ií]fico/i.test(street)) {
    dedupKey = 'bus:hub:pacifico'
  } else if (/plaza italia/i.test(street)) {
    dedupKey = 'bus:hub:plaza-italia'
  } else if (/\s+y\s+/i.test(street)) {
    const parts = street
      .split(/\s+y\s+/i)
      .map(normToken)
      .filter(Boolean)
      .sort()
    dedupKey = `bus:corner:${parts.join('+')}`
  } else {
    const blockMatch = street.match(/^(.+?)\s+(\d{3,4})\b/)
    if (blockMatch) {
      const streetKey = normToken(blockMatch[1])
      const century = Math.floor(Number(blockMatch[2]) / 200) * 200
      dedupKey = `bus:block:${streetKey}:${century}`
    } else {
      dedupKey = `bus:name:${normToken(street)}`
    }
  }

  return {
    category,
    cleanName,
    lines,
    hasExplicitLines: Boolean(explicitLines),
    street,
    dedupKey,
  }
}

/**
 * Genera un texto explicativo (callout) sobre la accesibilidad de la zona.
 */
function generateAccessibilityCallout({ total, subwayCount, trainCount, busCount, closestSubway, closestTrain }) {
  if (total === 0) {
    return 'Zona con baja conectividad de transporte público registrado en el radio.'
  }
  const railParts = []
  if (subwayCount > 0) {
    railParts.push(`subte a ${closestSubway.distanceMeters} m`)
  }
  if (trainCount > 0) {
    railParts.push(`tren a ${closestTrain.distanceMeters} m`)
  }
  if (railParts.length > 0) {
    return `Excelente conectividad con ${railParts.join(' y ')} más ${busCount} ${busCount === 1 ? 'parada' : 'paradas'} de colectivo en la zona.`
  }
  return `Conectividad con ${busCount} ${busCount === 1 ? 'parada' : 'paradas'} de colectivo en el radio.`
}

/**
 * Obtiene el análisis de accesibilidad y transporte público para un punto y radio.
 * Consulta Google Places API por estaciones de subte, tren y paradas de colectivos.
 */
export async function getAccessibilityAnalysis({ lat, lng, radiusInMeters = 1000 }) {
  const rawPlaces = await searchNearbyPlaces({
    lat,
    lng,
    radiusInMeters,
    includedTypes: TRANSIT_TYPES,
    maxResultCount: 20,
  })

  const dedupMap = new Map()

  for (const p of rawPlaces) {
    const enriched = enrichTransitPlace(p)
    if (!enriched) continue

    const distanceMeters = calculateDistanceMeters(lat, lng, p.location?.lat, p.location?.lng)
    const candidate = {
      id: p.id,
      name: p.name,
      cleanName: enriched.cleanName,
      category: enriched.category,
      type: CATEGORY_LABELS[enriched.category] || 'Transporte',
      lines: enriched.lines,
      hasExplicitLines: Boolean(enriched.hasExplicitLines),
      street: enriched.street,
      address: p.address || null,
      primaryType: p.primaryType,
      distanceMeters,
      distanceText: formatDistance(distanceMeters),
      location: p.location,
    }

    const existing = dedupMap.get(enriched.dedupKey)
    if (!existing) {
      dedupMap.set(enriched.dedupKey, candidate)
    } else {
      if (candidate.distanceMeters < existing.distanceMeters) {
        if (!candidate.hasExplicitLines && existing.hasExplicitLines) {
          candidate.lines = existing.lines
          candidate.hasExplicitLines = true
        }
        dedupMap.set(enriched.dedupKey, candidate)
      } else if (!existing.hasExplicitLines && candidate.hasExplicitLines) {
        existing.lines = candidate.lines
        existing.hasExplicitLines = true
      }
    }
  }

  // Priorizar Subte y Tren arriba (ordenados por distancia) y luego las paradas de Colectivo por distancia
  const CATEGORY_PRIORITY = { subway: 1, train: 2, bus: 3, other: 4 }
  const places = [...dedupMap.values()].sort((a, b) => {
    const prioDiff = (CATEGORY_PRIORITY[a.category] || 4) - (CATEGORY_PRIORITY[b.category] || 4)
    if (prioDiff !== 0) return prioDiff
    return a.distanceMeters - b.distanceMeters
  })

  let subwayCount = 0
  let trainCount = 0
  let busCount = 0
  let otherCount = 0

  for (const p of places) {
    if (p.category === 'subway') subwayCount++
    else if (p.category === 'train') trainCount++
    else if (p.category === 'bus') busCount++
    else otherCount++
  }

  const total = places.length
  const byDistance = [...places].sort((a, b) => a.distanceMeters - b.distanceMeters)
  const closestPlace = byDistance[0] || null
  const closestSubway = places.find((p) => p.category === 'subway') || null
  const closestTrain = places.find((p) => p.category === 'train') || null

  let level = 'baja'
  if (subwayCount > 0 || trainCount > 0 || total >= 6) {
    level = 'alta'
  } else if (total >= 2) {
    level = 'media'
  }

  const callout = generateAccessibilityCallout({
    total,
    subwayCount,
    trainCount,
    busCount,
    closestSubway,
    closestTrain,
  })

  return {
    total,
    subwayCount,
    trainCount,
    busCount,
    otherCount,
    level,
    closestPlace,
    closestSubway,
    closestTrain,
    callout,
    source: 'Google Places',
    queryDate: new Date().toISOString(),
    places,
  }
}
