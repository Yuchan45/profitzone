import { QueryTypes } from 'sequelize'
import { sequelize } from '../db/sequelize.js'

function toPercent(value, total) {
  return total > 0 ? Number(((value / total) * 100).toFixed(2)) : 0
}

function buildAgeDistribution({ edad0a14, edad15a34, edad35a59, edad60Mas }) {
  const total = edad0a14 + edad15a34 + edad35a59 + edad60Mas
  const groups = [
    {
      code: 'kids',
      label: 'Familias / niños (0–14)',
      range: '0-14',
      poblacionEstimada: edad0a14,
      porcentaje: toPercent(edad0a14, total),
    },
    {
      code: 'young',
      label: 'Jóvenes (15–34)',
      range: '15-34',
      poblacionEstimada: edad15a34,
      porcentaje: toPercent(edad15a34, total),
    },
    {
      code: 'adults',
      label: 'Adultos (35–59)',
      range: '35-59',
      poblacionEstimada: edad35a59,
      porcentaje: toPercent(edad35a59, total),
    },
    {
      code: 'seniors',
      label: 'Adultos mayores (60+)',
      range: '60+',
      poblacionEstimada: edad60Mas,
      porcentaje: toPercent(edad60Mas, total),
    },
  ]

  const predominant =
    total > 0 ? [...groups].sort((a, b) => b.poblacionEstimada - a.poblacionEstimada)[0] : null

  return {
    kids: groups[0],
    young: groups[1],
    adults: groups[2],
    seniors: groups[3],
    grupoPredominante: predominant
      ? {
          code: predominant.code,
          label: predominant.label,
          porcentaje: predominant.porcentaje,
        }
      : null,
  }
}

function buildSexDistribution({ mujeresEstimadas, varonesEstimados }) {
  const total = mujeresEstimadas + varonesEstimados
  const porcentajeMujeres = toPercent(mujeresEstimadas, total)
  const porcentajeVarones = toPercent(varonesEstimados, total)
  const indiceFeminidad =
    varonesEstimados > 0 ? Number(((mujeresEstimadas / varonesEstimados) * 100).toFixed(1)) : 0
  const diferencia = Math.abs(mujeresEstimadas - varonesEstimados)
  const diffPuntos = Math.abs(porcentajeMujeres - porcentajeVarones)

  let predominio = 'sin_datos'
  let callout = 'Sin datos de distribución por sexo en el radio.'

  if (total > 0) {
    const pctM = porcentajeMujeres.toLocaleString('es-AR')
    const pctV = porcentajeVarones.toLocaleString('es-AR')
    const femText = indiceFeminidad.toLocaleString('es-AR')

    if (diffPuntos < 1) {
      predominio = 'equilibrado'
      callout = `La distribución por sexo es equilibrada (${pctM}% mujeres y ${pctV}% varones).`
    } else if (mujeresEstimadas > varonesEstimados) {
      predominio = 'mujeres'
      callout = `En la zona hay más mujeres que varones (${pctM}% vs. ${pctV}%, ${femText} mujeres cada 100 varones).`
    } else {
      predominio = 'varones'
      callout = `En la zona hay más varones que mujeres (${pctV}% vs. ${pctM}%, ${femText} mujeres cada 100 varones).`
    }
  }

  return {
    mujeresEstimadas,
    varonesEstimados,
    porcentajeMujeres,
    porcentajeVarones,
    indiceFeminidad,
    diferencia,
    predominio,
    callout,
  }
}

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
      edad_0_14 AS edad0a14,
      edad_15_34 AS edad15a34,
      edad_35_59 AS edad35a59,
      edad_60_mas AS edad60Mas,
      mujeres,
      varones,
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
      distribucionPorEdad: buildAgeDistribution({
        edad0a14: 0,
        edad15a34: 0,
        edad35a59: 0,
        edad60Mas: 0,
      }),
      distribucionPorSexo: buildSexDistribution({
        mujeresEstimadas: 0,
        varonesEstimados: 0,
      }),
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
  let totalEdad0a14 = 0
  let totalEdad15a34 = 0
  let totalEdad35a59 = 0
  let totalEdad60Mas = 0
  let totalMujeres = 0
  let totalVarones = 0

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
    totalEdad0a14 += Number(row.edad0a14 || 0) * proportion
    totalEdad15a34 += Number(row.edad15a34 || 0) * proportion
    totalEdad35a59 += Number(row.edad35a59 || 0) * proportion
    totalEdad60Mas += Number(row.edad60Mas || 0) * proportion
    totalMujeres += Number(row.mujeres || 0) * proportion
    totalVarones += Number(row.varones || 0) * proportion

    if (row.barrio) barriosSet.add(row.barrio)
    if (row.comuna) comunasSet.add(Number(row.comuna))
  }

  const poblacionEstimada = Math.round(totalPoblacion)
  const viviendasEstimadas = Math.round(totalViviendas)
  const hogaresEstimados = Math.round(totalHogares)
  const hogaresNbiEstimados = Math.round(totalHogaresNbi)
  const edad0a14 = Math.round(totalEdad0a14)
  const edad15a34 = Math.round(totalEdad15a34)
  const edad35a59 = Math.round(totalEdad35a59)
  const edad60Mas = Math.round(totalEdad60Mas)
  const mujeresEstimadas = Math.round(totalMujeres)
  const varonesEstimados = Math.round(totalVarones)

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
    distribucionPorEdad: buildAgeDistribution({
      edad0a14,
      edad15a34,
      edad35a59,
      edad60Mas,
    }),
    distribucionPorSexo: buildSexDistribution({
      mujeresEstimadas,
      varonesEstimados,
    }),
    barrios: Array.from(barriosSet).sort(),
    comunas: Array.from(comunasSet).sort((a, b) => a - b),
    inCoverage: true,
  }
}
