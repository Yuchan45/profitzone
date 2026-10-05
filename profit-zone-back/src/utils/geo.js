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
