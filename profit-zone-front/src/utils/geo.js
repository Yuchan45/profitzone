// Metros que se caminan por minuto a paso normal (para "≈ 4 min a pie")
const WALKING_METERS_PER_MINUTE = 80

export function walkingMinutes(meters) {
  return Math.max(1, Math.round(meters / WALKING_METERS_PER_MINUTE))
}

// Ray casting sobre un anillo de [lat, lng]
function isInRing({ lat, lng }, ring) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [latI, lngI] = ring[i]
    const [latJ, lngJ] = ring[j]
    const crosses = latI > lat !== latJ > lat && lng < ((lngJ - lngI) * (lat - latI)) / (latJ - latI) + lngI
    if (crosses) inside = !inside
  }
  return inside
}

/**
 * Si el punto cae dentro de alguno de los polígonos (formato de /api/neighborhoods:
 * polígonos → anillos → [lat, lng]; los anillos después del primero son huecos).
 * Es una validación rápida para el mapa: la API valida de nuevo al guardar.
 */
export function isPointInPolygons(point, polygons) {
  return polygons.some(
    ([outer, ...holes]) => isInRing(point, outer) && !holes.some((hole) => isInRing(point, hole)),
  )
}
