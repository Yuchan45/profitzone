import { useMemo, useState } from 'react'
import { useNeighborhoods } from '../../../hooks/useNeighborhoods.js'
import { useNearbyPlaces } from '../../../hooks/useNearbyPlaces.js'
import LocationMap from '../LocationMap/LocationMap.jsx'
import CriteriaTable from '../CriteriaTable/CriteriaTable.jsx'
import PermitsGuide from '../PermitsGuide/PermitsGuide.jsx'
import StatusMessage from '../../molecules/StatusMessage/StatusMessage.jsx'
import StatTile from '../../molecules/StatTile/StatTile.jsx'
import IndicatorCard from '../../molecules/IndicatorCard/IndicatorCard.jsx'
import DisclaimerCard from '../../molecules/DisclaimerCard/DisclaimerCard.jsx'
import HourlyBars from '../../atoms/HourlyBars/HourlyBars.jsx'
import Button from '../../atoms/Button/Button.jsx'
import Icon from '../../atoms/Icon/Icon.jsx'
import { formatCurrency, formatDate, formatNumber } from '../../../utils/formatters.js'
import './ZoneAnalysis.css'

// Google Places devuelve como máximo 20 locales por consulta
const COMPETITION_MAX_RESULTS = 20
// Locales que se listan en la tarjeta de competencia (los más cercanos)
const COMPETITION_ROWS = 5
// Google Places devuelve como máximo 20 paradas/estaciones por consulta
const TRANSIT_MAX_RESULTS = 20
// Paradas que se listan en la tarjeta de accesibilidad (las más cercanas)
const TRANSIT_ROWS = 6

const PENDING_CAPTION = 'Dato pendiente'

// El censo trae los barrios en mayúsculas ("PALERMO")
const titleCase = (text) =>
  text.toLocaleLowerCase('es-AR').replace(/(^|\s)\p{L}/gu, (letter) => letter.toLocaleUpperCase('es-AR'))

// Un indicador que falló no tumba el resto: su tarjeta muestra el error y las demás siguen
const INDICATOR_ERROR = 'El resto del análisis no se ve afectado.'

/**
 * Estado de la tarjeta de un indicador. Todos llegan juntos en el reporte: mientras
 * carga o si falla el pedido entero, todas las tarjetas comparten ese estado (el error
 * del pedido y su "Reintentar" se muestran una sola vez, arriba de las tarjetas).
 */
function cardState(report, indicator) {
  if (report.status !== 'ok') return { status: report.status }
  if (indicator?.status === 'ok') return { status: 'ok' }
  if (indicator?.status === 'not_applicable') return { status: 'empty', empty: { title: 'No aplica para tu negocio.' } }
  return { status: 'error', error: INDICATOR_ERROR, onRetry: report.retry }
}

function DetailRows({ rows }) {
  return (
    <dl className="zone-analysis-rows">
      {rows
        .filter(({ value }) => value !== null && value !== undefined)
        .map(({ label, value }) => (
          <div key={label} className="zone-analysis-row">
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
    </dl>
  )
}

function competitionTile(indicator) {
  if (!indicator) return { value: null, caption: PENDING_CAPTION }
  const { status, data } = indicator
  if (status === 'not_applicable') return { value: null, caption: 'No aplica sin atención al público' }
  if (status !== 'ok') return { value: null, caption: 'No pudimos cargar este dato' }
  const value = data.isExact
    ? formatNumber(data.total)
    : data.total >= COMPETITION_MAX_RESULTS
      ? `${data.total}+`
      : formatNumber(data.total)
  return { value, caption: `${data.directCount} directos` }
}

function trafficTile(indicator) {
  if (!indicator) return { value: null, caption: PENDING_CAPTION }
  const { status, data } = indicator
  if (status === 'not_applicable') return { value: null, caption: 'No aplica sin atención al público' }
  if (status !== 'ok') return { value: null, caption: 'No pudimos cargar este dato' }
  return { value: `${data.score}/${data.scoreMax}`, caption: data.timeSlot }
}

function populationTile(indicator) {
  if (!indicator) return { value: null, caption: PENDING_CAPTION }
  const { status, data } = indicator
  if (status !== 'ok') return { value: null, caption: 'No pudimos cargar este dato' }
  if (!data.inCoverage) return { value: null, caption: 'Fuera de la cobertura del censo' }
  return { value: formatNumber(data.poblacionEstimada), caption: 'habitantes en el radio' }
}

function rentTile(indicator) {
  if (!indicator) return { value: null, caption: PENDING_CAPTION }
  const { status, data } = indicator
  if (status !== 'ok') return { value: null, caption: 'No pudimos cargar este dato' }
  if (data.totalInRadius === 0) return { value: null, caption: 'Sin locales en alquiler publicados en el radio' }
  // Solo los avisos con precio forman la mediana
  if (data.pricedInRadius === 0) return { value: null, caption: 'Hay locales publicados en el radio, pero sin precio' }
  const listings = data.pricedInRadius === 1 ? '1 aviso' : `${formatNumber(data.pricedInRadius)} avisos`
  // Es la mediana de los avisos del radio, no un promedio del barrio
  const surveyed = data.scrapedAt ? `, relevados el ${formatDate(data.scrapedAt)}` : ''
  return {
    value: formatCurrency(data.medianRentArs, 'ARS', { decimals: 0 }),
    caption: `por mes, mediana de ${listings} en el radio${surveyed}`,
  }
}

function accessibilityTile(indicator) {
  if (!indicator) return { value: null, caption: PENDING_CAPTION }
  const { status, data } = indicator
  if (status === 'not_applicable') return { value: null, caption: 'No aplica sin atención al público' }
  if (status !== 'ok') return { value: null, caption: 'No pudimos cargar este dato' }
  const value = data.total >= 20 ? '20+' : formatNumber(data.total)
  let caption = 'paradas en el radio'
  if (data.subwayCount > 0) {
    caption = data.subwayCount === 1 ? '1 subte en el radio' : `${data.subwayCount} subtes en el radio`
  } else if (data.trainCount > 0) {
    caption = data.trainCount === 1 ? '1 tren en el radio' : `${data.trainCount} trenes en el radio`
  } else if (data.total === 0) {
    caption = 'sin paradas en el radio'
  }
  return { value, caption }
}

function CompetitionCard({ report }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const indicator = report.data?.indicators.competition
  const state = cardState(report, indicator)
  const data = indicator?.data

  const places = data?.places

  // Ordenar primero las directas y luego por cercanía (distancia ascendente)
  const sortedPlaces = useMemo(() => {
    if (!places) return []
    return [...places].sort((a, b) => {
      if (a.type === 'Directa' && b.type !== 'Directa') return -1
      if (a.type !== 'Directa' && b.type === 'Directa') return 1
      return a.distanceMeters - b.distanceMeters
    })
  }, [places])

  const card = { icon: 'shield-check', title: 'Competencia', ...state }
  if (state.status !== 'ok') return <IndicatorCard {...card} />

  if (!data || data.total === 0) {
    return (
      <IndicatorCard
        {...card}
        status="empty"
        empty={{
          title: 'No encontramos locales del rubro en este radio.',
          text: 'Puede ser una oportunidad o una zona con poco movimiento comercial. Probá ampliar el radio para comparar.',
        }}
      />
    )
  }

  const canExpand = sortedPlaces.length > COMPETITION_ROWS
  const visiblePlaces = isExpanded ? sortedPlaces : sortedPlaces.slice(0, COMPETITION_ROWS)
  const total = data.isExact
    ? formatNumber(data.total)
    : data.total >= COMPETITION_MAX_RESULTS
      ? `${data.total}+`
      : formatNumber(data.total)

  return (
    <IndicatorCard
      {...card}
      value={total}
      caption={[
        `locales del rubro: ${data.directCount} directos y ${data.indirectCount} indirectos.`,
        data.averageRating ? `Rating promedio ${formatNumber(data.averageRating)}.` : null,
      ]
        .filter(Boolean)
        .join(' ')}
      callout={data.callout}
      source={`${data.source} · en vivo · ${formatDate(data.queryDate)} · se muestran ${visiblePlaces.length} de ${total}`}
    >
      <div className={`zone-analysis-table-wrap ${isExpanded ? 'zone-analysis-table-wrap--expanded' : ''}`}>
        <table className="zone-analysis-table">
          <thead>
            <tr>
              <th scope="col">Local</th>
              <th scope="col">Rating</th>
              <th scope="col">Reseñas</th>
              <th scope="col">Dist.</th>
              <th scope="col">Tipo</th>
            </tr>
          </thead>
          <tbody>
            {visiblePlaces.map((place) => (
              <tr key={place.id}>
                <th scope="row">{place.name}</th>
                <td>{place.rating ? formatNumber(place.rating) : '—'}</td>
                <td>{place.userRatingCount ? formatNumber(place.userRatingCount) : '—'}</td>
                <td>{place.distanceText}</td>
                <td>{place.type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {canExpand && (
        <div className="zone-analysis-expand-action">
          <button
            type="button"
            className="zone-analysis-expand-btn"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-expanded={isExpanded}
          >
            <span>{isExpanded ? 'Ver menos' : `Ver todas las competencias (${sortedPlaces.length})`}</span>
            <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} size={14} />
          </button>
        </div>
      )}
    </IndicatorCard>
  )
}

function TrafficCard({ report }) {
  const indicator = report.data?.indicators.traffic
  const state = cardState(report, indicator)
  const card = { icon: 'chart-line', title: 'Afluencia a locales del radio', ...state }
  if (state.status !== 'ok') return <IndicatorCard {...card} />

  const { data } = indicator
  return (
    <IndicatorCard
      {...card}
      badge={data.badge}
      value={`${data.score}/${data.scoreMax}`}
      caption={`de actividad media en tu franja (${data.timeSlot}).`}
      callout={data.callout}
      source={data.source}
    >
      <HourlyBars
        hours={data.hourlyActivity}
        summary={`Actividad estimada por hora. Tu franja (${data.timeSlot}) promedia ${data.score} de ${data.scoreMax}.`}
      />
    </IndicatorCard>
  )
}

function PopulationCard({ report }) {
  const indicator = report.data?.indicators.density
  const state = cardState(report, indicator)
  const card = { icon: 'users', title: 'Población', ...state }
  if (state.status !== 'ok') return <IndicatorCard {...card} />

  const { data } = indicator
  if (!data.inCoverage) {
    return (
      <IndicatorCard
        {...card}
        status="empty"
        empty={{ title: 'Fuera de la cobertura del censo.', text: data.message }}
      />
    )
  }

  return (
    <IndicatorCard
      {...card}
      value={formatNumber(data.poblacionEstimada)}
      caption="habitantes estimados en el radio."
      source="Censo nacional · INDEC · por radio censal, ponderado por área"
    >
      <DetailRows
        rows={[
          { label: 'Densidad', value: `${formatNumber(data.densidadHabKm2)} hab/km²` },
          { label: 'Hogares', value: formatNumber(data.hogaresEstimados) },
          { label: 'Hogares con NBI', value: `${formatNumber(data.porcentajeNbi)} %` },
          { label: 'Barrios', value: data.barrios?.map(titleCase).join(', ') || null },
        ]}
      />
    </IndicatorCard>
  )
}

function RentCard({ report }) {
  const indicator = report.data?.indicators.rent
  const state = cardState(report, indicator)
  const card = { icon: 'store', title: 'Alquiler comercial', ...state }
  if (state.status !== 'ok') return <IndicatorCard {...card} />

  const { data } = indicator
  // Solo los avisos con precio forman la mediana
  if (data.pricedInRadius === 0) {
    return (
      <IndicatorCard
        {...card}
        status="empty"
        empty={{
          title:
            data.totalInRadius === 0
              ? 'No hay locales en alquiler publicados en el radio.'
              : 'Los locales publicados en el radio no informan el precio.',
          text: 'Probá ampliar el radio para comparar.',
        }}
      />
    )
  }

  const listings = data.pricedInRadius === 1 ? '1 aviso' : `${formatNumber(data.pricedInRadius)} avisos`
  const money = (value) => (value ? formatCurrency(value, 'ARS', { decimals: 0 }) : null)
  return (
    <IndicatorCard
      {...card}
      value={money(data.medianRentArs)}
      caption={`por mes, mediana de ${listings} en el radio (no es un promedio del barrio).`}
      source={`ZonaProp · avisos de locales comerciales en alquiler${
        data.scrapedAt ? `, relevados el ${formatDate(data.scrapedAt)}` : ''
      }`}
    >
      <DetailRows
        rows={[
          { label: 'Promedio', value: money(data.averageRentArs) },
          { label: 'Precio por m²', value: money(data.medianPricePerM2Ars) },
          {
            label: 'Superficie promedio',
            value: data.averageSurfaceM2 ? `${formatNumber(data.averageSurfaceM2)} m²` : null,
          },
        ]}
      />
    </IndicatorCard>
  )
}

function AccessibilityCard({ report }) {
  const indicator = report.data?.indicators.accessibility
  const state = cardState(report, indicator)
  const card = { icon: 'bus', title: 'Accesibilidad y transporte', ...state }
  if (state.status !== 'ok') return <IndicatorCard {...card} />

  const { data } = indicator
  if (data.total === 0) {
    return (
      <IndicatorCard
        {...card}
        status="empty"
        empty={{
          title: 'No encontramos paradas ni estaciones en este radio.',
          text: 'Puede ser una zona residencial interna o con poco transporte registrado. Probá ampliar el radio para comparar.',
        }}
      />
    )
  }

  const places = (data.places || []).slice(0, TRANSIT_ROWS)
  const total = data.total >= TRANSIT_MAX_RESULTS ? `${data.total}+` : formatNumber(data.total)

  const breakdown = []
  if (data.subwayCount > 0) {
    breakdown.push(`${data.subwayCount} ${data.subwayCount === 1 ? 'subte' : 'subtes'}`)
  }
  if (data.trainCount > 0) {
    breakdown.push(`${data.trainCount} ${data.trainCount === 1 ? 'tren' : 'trenes'}`)
  }
  if (data.busCount > 0) {
    breakdown.push(`${data.busCount} ${data.busCount === 1 ? 'parada de colectivo' : 'paradas de colectivo'}`)
  }
  if (data.otherCount > 0) {
    breakdown.push(`${data.otherCount} otros transportes`)
  }

  const caption = breakdown.length > 0
    ? `puntos de transporte en el radio: ${breakdown.join(', ')}.`
    : 'puntos de transporte en el radio.'

  return (
    <IndicatorCard
      {...card}
      value={total}
      caption={caption}
      callout={data.callout}
      source={`${data.source} · en vivo · ${formatDate(data.queryDate)} · se muestran ${places.length} de ${total}`}
    >
      <div className="zone-analysis-table-wrap">
        <table className="zone-analysis-table zone-analysis-table--transit">
          <thead>
            <tr>
              <th scope="col">Tipo</th>
              <th scope="col">Línea / Estación</th>
              <th scope="col">Calle / Ubicación</th>
              <th scope="col">Dist.</th>
            </tr>
          </thead>
          <tbody>
            {places.map((place) => (
              <tr key={place.id}>
                <td>
                  <span className={`zone-analysis-transit-badge zone-analysis-transit-badge--${place.category}`}>
                    {place.type || 'Transporte'}
                  </span>
                </td>
                <th scope="row">{place.lines || place.cleanName || '—'}</th>
                <td>{place.street || place.address || '—'}</td>
                <td>{place.distanceText}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </IndicatorCard>
  )
}

/**
 * Análisis y reporte completo de una zona: mapa, tarjetas de cada indicador, resumen,
 * fortalezas y debilidades, la zona en datos y fuentes. Lo usan el paso 4 del flujo
 * (Analisis) y el detalle de un reporte guardado (ReporteGuardado), para que un reporte
 * se vea igual en los dos lugares.
 * - `report`: lo que devuelve useAnalysisReport ({ status, data, error, retry }).
 * - `point`, `categoryCode`, `subcategoryCode`: punto y rubro para el mapa mientras carga
 *   el reporte (ej. los del flujo); con el reporte se usan los suyos.
 * - `match`: criterio de competencia directa para los puntos del mapa (sin él, todos
 *   los locales se ven iguales y la referencia de "directa" no se muestra).
 * - `serviceMode`: respuesta a "¿Cómo vas a atender al público?" para las notas de la
 *   guía de trámites. El reporte no trae las respuestas: sin ella, solo se deduce
 *   "sin atención al público" de los indicadores que no aplican.
 */
function ZoneAnalysis({
  report,
  point = null,
  categoryCode = null,
  subcategoryCode = null,
  match = null,
  serviceMode = null,
}) {
  const neighborhoods = useNeighborhoods()
  const reportData = report.data
  const analysis = reportData?.analysis
  const location = analysis?.location ?? point
  const neighborhood = neighborhoods.data?.[0] ?? null

  // Puntos del mapa: negocios del rubro según OpenStreetMap. Los locales de Google Places
  // van solo en la tabla: sus términos no permiten mostrarlos sobre un mapa que no es de Google.
  const nearbyPlaces = useNearbyPlaces({
    lat: location?.lat ?? null,
    lng: location?.lng ?? null,
    radius: location?.radius,
    category: analysis?.category.code ?? categoryCode,
    subcategory: analysis?.subcategory.code ?? subcategoryCode,
    match,
  })

  const noPublic = reportData?.indicators?.competition?.status === 'not_applicable'

  return (
    <>
      {report.status === 'error' && (
        <div className="zone-analysis-error">
          <StatusMessage variant="error">No pudimos analizar la zona: {report.error}</StatusMessage>
          <Button variant="secondary" size="m" onClick={report.retry}>
            Reintentar
          </Button>
        </div>
      )}

      {/* 1. Mapa estirado a ancho completo */}
      <div className="zone-analysis-map-stretched">
        {location && neighborhoods.status !== 'loading' ? (
          <LocationMap
            center={neighborhood?.center ?? location}
            bounds={neighborhood?.bounds}
            boundary={neighborhood?.boundary}
            point={location}
            radius={location.radius}
            places={nearbyPlaces.data?.places}
            readOnly
          />
        ) : (
          <div className="flow-skeleton zone-analysis-map-skeleton" aria-busy="true" aria-label="Cargando el mapa" />
        )}
        <ul className="zone-analysis-legend" aria-label="Referencias del mapa">
          {match && <li className="zone-analysis-legend-item zone-analysis-legend-item--direct">Competencia directa</li>}
          <li className="zone-analysis-legend-item">{match ? 'Otros locales del rubro' : 'Locales del rubro'}</li>
        </ul>
      </div>

      {/* 2. Todos los cuadros con datos en una columna */}
      {report.status !== 'error' && (
        <div className="zone-analysis-cards">
          {noPublic ? (
            <p className="zone-analysis-notice">
              <Icon name="info" size={18} />
              Como elegiste “Sin atención al público”, no mostramos competencia ni afluencia.
            </p>
          ) : (
            <>
              <CompetitionCard report={report} />
              <TrafficCard report={report} />
            </>
          )}
          <AccessibilityCard report={report} />
          <PopulationCard report={report} />
          <RentCard report={report} />
        </div>
      )}

      {/* 3. El reporte: resumen, fortalezas y debilidades, datos y fuentes */}
      {report.status === 'loading' && (
        <div className="zone-analysis-loading" aria-busy="true" aria-label="Generando el reporte">
          <div className="flow-skeleton" />
          <div className="flow-skeleton zone-analysis-skeleton-tall" />
        </div>
      )}

      {report.status === 'ok' && reportData && (
        <>
          {reportData.summary && (
            <section className="zone-analysis-card" aria-labelledby="zone-analysis-summary-title">
              <h2 id="zone-analysis-summary-title" className="zone-analysis-card-title">
                Resumen
              </h2>
              <p className="zone-analysis-summary">{reportData.summary}</p>
            </section>
          )}

          <CriteriaTable criteria={reportData.criteria} />

          <section className="zone-analysis-card" aria-labelledby="zone-analysis-data-title">
            <h2 id="zone-analysis-data-title" className="zone-analysis-card-title">
              La zona en datos
            </h2>
            <div className="zone-analysis-tiles">
              <StatTile label="Competencia" {...competitionTile(reportData.indicators?.competition)} />
              <StatTile label="Afluencia (estimada)" {...trafficTile(reportData.indicators?.traffic)} />
              <StatTile label="Población" {...populationTile(reportData.indicators?.density)} />
              <StatTile label="Alquiler" {...rentTile(reportData.indicators?.rent)} />
              <StatTile label="Accesibilidad" {...accessibilityTile(reportData.indicators?.accessibility)} />
            </div>
          </section>

          <PermitsGuide
            categoryCode={analysis.category.code}
            subcategoryCode={analysis.subcategory.code}
            serviceMode={serviceMode ?? (noPublic ? 'no_public' : null)}
            showPageLink
          />

          {((reportData.notices && reportData.notices.length > 0) ||
            (reportData.sources && reportData.sources.length > 0)) && (
            <section className="zone-analysis-card" aria-labelledby="zone-analysis-sources-title">
              <h2 id="zone-analysis-sources-title" className="zone-analysis-card-title">
                Fuentes y avisos
              </h2>
              <ul className="zone-analysis-notes">
                {[...(reportData.notices || []), ...(reportData.sources || [])].map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </section>
          )}

          <DisclaimerCard />
        </>
      )}
    </>
  )
}

export default ZoneAnalysis
