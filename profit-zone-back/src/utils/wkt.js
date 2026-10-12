/**
 * Convierte un POLYGON o MULTIPOLYGON en WKT (lng lat) a anillos de [lat, lng],
 * el formato que usa Leaflet. Devuelve una lista de polígonos; cada polígono es
 * una lista de anillos (el primero es el borde exterior, los demás son huecos).
 */
export function wktToLatLngPolygons(wkt) {
  const isMulti = /^\s*MULTIPOLYGON/i.test(wkt)
  // Profundidad de paréntesis donde están las coordenadas de cada anillo
  const ringDepth = isMulti ? 3 : 2
  const body = wkt.slice(wkt.indexOf('('))
  const polygons = []
  let polygon = []
  let ring = ''
  let depth = 0

  for (const char of body) {
    if (char === '(') {
      depth += 1
      if (depth === ringDepth - 1) polygon = []
      if (depth === ringDepth) ring = ''
    } else if (char === ')') {
      if (depth === ringDepth) polygon.push(parseRing(ring))
      if (depth === ringDepth - 1) polygons.push(polygon)
      depth -= 1
    } else if (depth === ringDepth) {
      ring += char
    }
  }

  return polygons
}

function parseRing(text) {
  return text.split(',').map((pair) => {
    const [lng, lat] = pair.trim().split(/\s+/).map(Number)
    return [lat, lng]
  })
}
