// Descarga los datos demográficos del Censo 2022 desde la API oficial del
// Geoportal del INDEC (https://portalgeoestadistico.indec.gob.ar/ ->
// https://datosestadisticos.indec.gob.ar/api/v1) y enriquece cada radio censal
// de src/db/seeders/data/caba_census_radios.geojson con:
//   - EDAD_0_14, EDAD_15_34, EDAD_35_59, EDAD_60_MAS (Opción A: Indicador 182 por radio + Indicador 514 quinquenal por comuna)
//   - MUJERES, VARONES (Indicador 174 por radio)
//
// Uso (desde profit-zone-back/): node scripts/fetch-indec-demographics.js
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const GEOJSON_PATH = path.resolve(__dirname, '../src/db/seeders/data/caba_census_radios.geojson')
const API_BASE = 'https://datosestadisticos.indec.gob.ar/api/v1'
const PREFIX = '[ProfitZone]'

// IDs fijos de dimensiones y miembros en la API del Geoportal INDEC (Censo 2022)
const YEAR_2022_ID = 108
const AGE_0_14_ID = 13224
const AGE_15_64_ID = 13225
const AGE_65_79_ID = 13226
const AGE_80_PLUS_ID = 13227

const SEX_FEMALE_ID = 31
const SEX_MALE_ID = 32
const SEX_BOTH_ID = 34

const QUINQUENAL_GROUPS = {
  kids: ['0-4', '5-9', '10-14'],
  young: ['15-19', '20-24', '25-29', '30-34'],
  adults: ['35-39', '40-44', '45-49', '50-54', '55-59'],
  seniors60_64: ['60-64'],
  seniors65Plus: ['65-69', '70-74', '75-79', '80-84', '85-89', '90-94', '95-99', '100 y más'],
}

async function fetchJson(url) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} al consultar ${url}`)
  }
  return response.json()
}

/**
 * Redondea un arreglo de valores proporcionales para que su suma entera sea
 * exactamente igual a `targetTotal` (método del resto mayor).
 */
function roundToTotal(weights, targetTotal) {
  const totalWeight = weights.reduce((acc, w) => acc + w, 0)
  if (targetTotal <= 0 || totalWeight <= 0) {
    return weights.map(() => 0)
  }
  const exact = weights.map((w) => (w / totalWeight) * targetTotal)
  const floored = exact.map((v) => Math.floor(v))
  let remainder = targetTotal - floored.reduce((acc, v) => acc + v, 0)

  const order = exact
    .map((v, idx) => ({ idx, frac: v - floored[idx] }))
    .sort((a, b) => b.frac - a.frac)

  for (let i = 0; i < remainder; i++) {
    floored[order[i].idx] += 1
  }
  return floored
}

/**
 * Convierte el código de radio INDEC de 9 dígitos de CABA (02CCCFFRR) al formato
 * RADIO_ID del GeoJSON de CABA (Comuna_Fracción_Radio, ej. "14_3_12").
 */
function indecCodeToRadioId(code) {
  const str = String(code)
  const comuna = Number(str.slice(2, 5)) / 7
  const fraccion = Number(str.slice(5, 7))
  const radio = Number(str.slice(7, 9))
  return {
    radioId: `${comuna}_${fraccion}_${radio}`,
    fraccionKey: `${comuna}_${fraccion}`,
    comuna,
  }
}

async function fetchComunaQuinquenalSplits() {
  console.log(`${PREFIX} Consultando Indicador 514 (grupos quinquenales por Comuna en CABA)...`)
  const dimRes = await fetchJson(`${API_BASE}/indicator/514/dimensions?format=json&lang=es&in=1`)
  const dims = dimRes.body.dimensions
  const dDepto = dims.find((d) => d.id === 1030)
  const dQuinq = dims.find((d) => d.id === 23312)

  const cabaComunas = dDepto.members.filter((m) => String(m.code).startsWith('02'))
  const comunaByMemberId = new Map(
    cabaComunas.map((m) => [m.id, Number(String(m.code).slice(2)) / 7]),
  )
  const quinqNameById = new Map(dQuinq.members.map((m) => [m.id, m.name]))

  const membersParam = [
    YEAR_2022_ID,
    SEX_BOTH_ID,
    ...dQuinq.members.map((m) => m.id),
    ...cabaComunas.map((m) => m.id),
  ].join(',')

  const recRes = await fetchJson(
    `${API_BASE}/indicator/514/records?format=json&lang=es&members=${membersParam}`,
  )

  const countsByComuna = new Map()
  for (let c = 1; c <= 15; c++) countsByComuna.set(c, new Map())

  for (const row of recRes.body.data) {
    const comuna = comunaByMemberId.get(row.dim_1030)
    const qName = quinqNameById.get(row.dim_23312)
    if (!comuna || !qName) continue
    countsByComuna.get(comuna).set(qName, Number(row.value) || 0)
  }

  const splitsByComuna = new Map()
  for (const [comuna, qMap] of countsByComuna.entries()) {
    const sumGroup = (names) => names.reduce((acc, n) => acc + (qMap.get(n) || 0), 0)
    const kids = sumGroup(QUINQUENAL_GROUPS.kids)
    const young = sumGroup(QUINQUENAL_GROUPS.young)
    const adults = sumGroup(QUINQUENAL_GROUPS.adults)
    const s60_64 = sumGroup(QUINQUENAL_GROUPS.seniors60_64)
    const s65Plus = sumGroup(QUINQUENAL_GROUPS.seniors65Plus)
    const total15_64 = young + adults + s60_64 || 1

    splitsByComuna.set(comuna, {
      share15_34: young / total15_64,
      share35_59: adults / total15_64,
      share60_64: s60_64 / total15_64,
      fallbackAgeWeights: [kids, young, adults, s60_64 + s65Plus],
    })
  }

  return splitsByComuna
}

async function fetchIndicatorByMember(indicatorId, memberId) {
  const url = `${API_BASE}/indicator/${indicatorId}/records?format=json&lang=es&members=${YEAR_2022_ID},${memberId}`
  const res = await fetchJson(url)
  return (res.body?.data || []).filter((row) => String(row.path_97069 || '').startsWith('02'))
}

async function main() {
  const splitsByComuna = await fetchComunaQuinquenalSplits()

  console.log(`${PREFIX} Descargando edades por radio censal (Indicador 182)...`)
  const [rows0_14, rows15_64, rows65_79, rows80Plus] = await Promise.all([
    fetchIndicatorByMember(182, AGE_0_14_ID),
    fetchIndicatorByMember(182, AGE_15_64_ID),
    fetchIndicatorByMember(182, AGE_65_79_ID),
    fetchIndicatorByMember(182, AGE_80_PLUS_ID),
  ])

  console.log(`${PREFIX} Descargando sexo por radio censal (Indicador 174)...`)
  const [rowsFemale, rowsMale] = await Promise.all([
    fetchIndicatorByMember(174, SEX_FEMALE_ID),
    fetchIndicatorByMember(174, SEX_MALE_ID),
  ])

  const radioStats = new Map()
  const fraccionStats = new Map()
  const comunaSexStats = new Map()

  const ensureStat = (map, key) => {
    if (!map.has(key)) {
      map.set(key, { a0_14: 0, a15_64: 0, a65_79: 0, a80_plus: 0, mujeres: 0, varones: 0 })
    }
    return map.get(key)
  }

  const accumulateAge = (rows, field) => {
    for (const row of rows) {
      const meta = indecCodeToRadioId(row.path_97069)
      const val = Number(row.value) || 0
      ensureStat(radioStats, meta.radioId)[field] += val
      ensureStat(fraccionStats, meta.fraccionKey)[field] += val
    }
  }

  accumulateAge(rows0_14, 'a0_14')
  accumulateAge(rows15_64, 'a15_64')
  accumulateAge(rows65_79, 'a65_79')
  accumulateAge(rows80Plus, 'a80_plus')

  const accumulateSex = (rows, field) => {
    for (const row of rows) {
      const meta = indecCodeToRadioId(row.path_97069)
      const val = Number(row.value) || 0
      ensureStat(radioStats, meta.radioId)[field] += val
      ensureStat(fraccionStats, meta.fraccionKey)[field] += val
      ensureStat(comunaSexStats, meta.comuna)[field] += val
    }
  }

  accumulateSex(rowsFemale, 'mujeres')
  accumulateSex(rowsMale, 'varones')

  const geojson = JSON.parse(fs.readFileSync(GEOJSON_PATH, 'utf8'))
  let directMatches = 0
  let fraccionFallbacks = 0

  for (const feature of geojson.features) {
    const props = feature.properties
    const radioId = String(props.RADIO_ID)
    const [comunaStr, fraccionStr] = radioId.split('_')
    const comuna = Number(comunaStr) || Number(props.COMUNA) || 14
    const fraccionKey = `${comuna}_${fraccionStr}`
    const poblacion = Math.round(Number(props.POBLACION)) || 0

    const split = splitsByComuna.get(comuna) || splitsByComuna.get(14)
    let stat = radioStats.get(radioId)
    if (stat && stat.a0_14 + stat.a15_64 + stat.a65_79 + stat.a80_plus > 0) {
      directMatches++
    } else {
      stat = fraccionStats.get(fraccionKey)
      fraccionFallbacks++
    }

    const ageWeights =
      stat && stat.a0_14 + stat.a15_64 + stat.a65_79 + stat.a80_plus > 0
        ? [
            stat.a0_14,
            stat.a15_64 * split.share15_34,
            stat.a15_64 * split.share35_59,
            stat.a15_64 * split.share60_64 + stat.a65_79 + stat.a80_plus,
          ]
        : split.fallbackAgeWeights

    const [edad0a14, edad15a34, edad35a59, edad60Mas] = roundToTotal(ageWeights, poblacion)

    const cSex = comunaSexStats.get(comuna) || { mujeres: 53, varones: 47 }
    const sexWeights =
      stat && stat.mujeres + stat.varones > 0
        ? [stat.mujeres, stat.varones]
        : [cSex.mujeres, cSex.varones]

    const [mujeres, varones] = roundToTotal(sexWeights, poblacion)

    props.EDAD_0_14 = edad0a14
    props.EDAD_15_34 = edad15a34
    props.EDAD_35_59 = edad35a59
    props.EDAD_60_MAS = edad60Mas
    props.MUJERES = mujeres
    props.VARONES = varones
  }

  const featureLines = geojson.features.map((f, idx) => {
    const suffix = idx < geojson.features.length - 1 ? ',' : ''
    return `${JSON.stringify(f)}${suffix}`
  })
  const formattedGeojson = [
    '{',
    `"type": ${JSON.stringify(geojson.type)},`,
    `"name": ${JSON.stringify(geojson.name)},`,
    `"crs": ${JSON.stringify(geojson.crs)},`,
    '"features": [',
    ...featureLines,
    ']',
    '}',
    '',
  ].join('\n')

  fs.writeFileSync(GEOJSON_PATH, formattedGeojson)
  console.log(
    `${PREFIX} GeoJSON enriquecido exitosamente (${geojson.features.length} radios: ${directMatches} directos, ${fraccionFallbacks} por fracción).`,
  )
}

main().catch((error) => {
  console.error(`${PREFIX} Error al descargar demografía del INDEC:`, error.message)
  process.exitCode = 1
})

