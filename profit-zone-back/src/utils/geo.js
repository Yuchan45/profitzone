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
 * Si el punto cae dentro de alguno de los polígonos (polígonos → anillos → [lat, lng];
 * los anillos después del primero son huecos). Es el mismo cálculo que hace el
 * front sobre el contorno de /api/neighborhoods, así los dos coinciden en el borde.
 */
export function isPointInPolygons(point, polygons) {
  return polygons.some(
    ([outer, ...holes]) => isInRing(point, outer) && !holes.some((hole) => isInRing(point, hole)),
  )
}

/**
 * Calcula la distancia geodésica en metros entre dos coordenadas (fórmula de Haversine).
 */
export function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return 0
  const R = 6371000 // Radio de la Tierra en metros
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c)
}

export function formatDistance(meters) {
  if (meters < 1000) return `${meters} m`
  return `${(meters / 1000).toFixed(1)} km`
}
