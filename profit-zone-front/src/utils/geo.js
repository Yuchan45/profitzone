// Metros que se caminan por minuto a paso normal (para "≈ 4 min a pie")
const WALKING_METERS_PER_MINUTE = 80

export function walkingMinutes(meters) {
  return Math.max(1, Math.round(meters / WALKING_METERS_PER_MINUTE))
}

/** Distancia en metros entre dos puntos { lat, lng } (fórmula de haversine). */
export function distanceMeters(a, b) {
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * 6371000 * Math.asin(Math.sqrt(h))
}

const kilometers = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 })

/** Distancia para mostrar: "300 m", "1,25 km", "2 km". */
export function formatDistance(meters) {
  return meters < 1000 ? `${meters} m` : `${kilometers.format(meters / 1000)} km`
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
