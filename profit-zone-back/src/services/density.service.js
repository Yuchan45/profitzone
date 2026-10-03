import { QueryTypes } from 'sequelize'
import { sequelize } from '../db/sequelize.js'

/**
 * Calcula la densidad poblacional y métricas sociodemográficas en un punto con un radio (buffer)
 * sobre los radios censales de CABA en census_data.census_radios usando interpolación areal.
 */
export async function getDensityInRadius({ lat, lng, radiusInMeters }) {
  const bufferAreaM2 = Math.PI * Math.pow(radiusInMeters, 2)
  const bufferAreaKm2 = bufferAreaM2 / 1_000_000
  const bufferAreaHa = bufferAreaM2 / 10_000

  // Consulta espacial con SQL Server:
  // 1. Crea el punto geográfico y el círculo de influencia con STBuffer(metros).
  // 2. STIntersects filtra usando el índice espacial.
  // 3. STIntersection calcula el polígono recortado dentro del círculo para ponderar por superficie.
  const query = `
    DECLARE @point geography = geography::Point(:lat, :lng, 4326);
    DECLARE @buffer geography = @point.STBuffer(:radiusInMeters);

    SELECT 
      radio_id AS radioId,
      barrio,
      comuna,
      poblacion,
      viviendas,
      hogares,
      hogares_nbi AS hogaresNbi,
      area_km2 AS areaKm2,
      geom.STIntersection(@buffer).STArea() AS intersectionAreaM2,
      geom.STArea() AS totalAreaM2
    FROM census_data.census_radios
    WHERE geom.STIntersects(@buffer) = 1;
  `

  const rows = await sequelize.query(query, {
    replacements: { lat, lng, radiusInMeters },
    type: QueryTypes.SELECT,
  })

  if (rows.length === 0) {
    return {
      center: { lat, lng },
      radiusInMeters,
      bufferAreaKm2: Number(bufferAreaKm2.toFixed(4)),
      bufferAreaHa: Number(bufferAreaHa.toFixed(2)),
      radiosInterceptados: 0,
      poblacionEstimada: 0,
      densidadHabKm2: 0,
      densidadHabHa: 0,
      viviendasEstimadas: 0,
      hogaresEstimados: 0,
      hogaresNbiEstimados: 0,
      porcentajeNbi: 0,
      barrios: [],
      comunas: [],
      inCoverage: false,
      message: 'El punto y radio seleccionados no intersectan radios censales en CABA.',
    }
  }

  let totalPoblacion = 0
  let totalViviendas = 0
  let totalHogares = 0
  let totalHogaresNbi = 0

  const barriosSet = new Set()
  const comunasSet = new Set()

  for (const row of rows) {
    // Proporción de la superficie del radio que cae dentro de nuestro círculo
    const totalArea = Number(row.totalAreaM2) || 1
    const intersectionArea = Number(row.intersectionAreaM2) || 0
    const proportion = Math.min(1, Math.max(0, intersectionArea / totalArea))

    totalPoblacion += Number(row.poblacion) * proportion
    totalViviendas += Number(row.viviendas) * proportion
    totalHogares += Number(row.hogares) * proportion
    totalHogaresNbi += Number(row.hogaresNbi) * proportion

    if (row.barrio) barriosSet.add(row.barrio)
    if (row.comuna) comunasSet.add(Number(row.comuna))
  }

  const poblacionEstimada = Math.round(totalPoblacion)
  const viviendasEstimadas = Math.round(totalViviendas)
  const hogaresEstimados = Math.round(totalHogares)
  const hogaresNbiEstimados = Math.round(totalHogaresNbi)

  const porcentajeNbi =
    hogaresEstimados > 0 ? Number(((hogaresNbiEstimados / hogaresEstimados) * 100).toFixed(2)) : 0

  const densidadHabKm2 = bufferAreaKm2 > 0 ? Math.round(poblacionEstimada / bufferAreaKm2) : 0
  const densidadHabHa = bufferAreaHa > 0 ? Number((poblacionEstimada / bufferAreaHa).toFixed(2)) : 0

  return {
    center: { lat, lng },
    radiusInMeters,
    bufferAreaKm2: Number(bufferAreaKm2.toFixed(4)),
    bufferAreaHa: Number(bufferAreaHa.toFixed(2)),
    radiosInterceptados: rows.length,
    poblacionEstimada,
    densidadHabKm2,
    densidadHabHa,
    viviendasEstimadas,
    hogaresEstimados,
    hogaresNbiEstimados,
    porcentajeNbi,
    barrios: Array.from(barriosSet).sort(),
    comunas: Array.from(comunasSet).sort((a, b) => a - b),
    inCoverage: true,
  }
}
