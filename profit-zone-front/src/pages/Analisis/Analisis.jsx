import { useParams } from 'react-router-dom'
import { useAnalysisFlow } from '../../hooks/useAnalysisFlow.js'
import { useFlowSteps } from '../../hooks/useFlowSteps.js'
import { useFlowAnalysisReport } from '../../hooks/useFlowAnalysisReport.js'
import { useNeighborhoods } from '../../hooks/useNeighborhoods.js'
import { useNearbyPlaces } from '../../hooks/useNearbyPlaces.js'
import { useSubcategorySurvey } from '../../hooks/useSubcategorySurvey.js'
import Stepper from '../../components/organisms/Stepper/Stepper.jsx'
import LocationMap from '../../components/organisms/LocationMap/LocationMap.jsx'
import BusinessSummary from '../../components/organisms/BusinessSummary/BusinessSummary.jsx'
import StepHeading from '../../components/molecules/StepHeading/StepHeading.jsx'
import StatusMessage from '../../components/molecules/StatusMessage/StatusMessage.jsx'
import IndicatorCard from '../../components/molecules/IndicatorCard/IndicatorCard.jsx'
import HourlyBars from '../../components/atoms/HourlyBars/HourlyBars.jsx'
import DisclaimerCard from '../../components/molecules/DisclaimerCard/DisclaimerCard.jsx'
import Button from '../../components/atoms/Button/Button.jsx'
import Icon from '../../components/atoms/Icon/Icon.jsx'
import { formatCurrency, formatDate, formatNumber } from '../../utils/formatters.js'
import { buildSummaryRows, directMatch } from '../../utils/surveySummary.js'
import './Analisis.css'

// Google Places devuelve como máximo 20 locales por consulta
const COMPETITION_MAX_RESULTS = 20
// Locales que se listan en la tarjeta de competencia (los más cercanos)
const COMPETITION_ROWS = 5

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
    <dl className="analisis-rows">
      {rows
        .filter(({ value }) => value !== null && value !== undefined)
        .map(({ label, value }) => (
          <div key={label} className="analisis-row">
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
    </dl>
  )
}

function CompetitionCard({ report }) {
  const indicator = report.data?.indicators.competition
  const state = cardState(report, indicator)
  const card = { icon: 'shield-check', title: 'Competencia', ...state }
  if (state.status !== 'ok') return <IndicatorCard {...card} />

  const { data } = indicator
  if (data.total === 0) {
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

  const places = data.places.slice(0, COMPETITION_ROWS)
  const total = data.total >= COMPETITION_MAX_RESULTS ? `${data.total}+` : formatNumber(data.total)
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
      source={`${data.source} · en vivo · ${formatDate(data.queryDate)} · se muestran ${places.length} de ${total}`}
    >
      <div className="analisis-table-wrap">
        <table className="analisis-table">
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
            {places.map((place) => (
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
          title: 'No hay locales en alquiler publicados en el radio.',
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
      caption={`por mes, mediana de ${listings} en el radio.`}
      source="ZonaProp · avisos de locales comerciales en alquiler"
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

function Analisis() {
  const { id } = useParams()
  const flow = useAnalysisFlow()
  const { categoryCode, subcategoryCode, answers } = flow
  const steps = useFlowSteps()
  const report = useFlowAnalysisReport(id)
  const neighborhoods = useNeighborhoods()

  // Solo el análisis en curso tiene sus respuestas en el flujo (un reporte viejo no)
  const { isCurrentAnalysis } = report
  const survey = useSubcategorySurvey(
    isCurrentAnalysis ? categoryCode : null,
    isCurrentAnalysis ? subcategoryCode : null,
  )

  const analysis = report.data?.analysis
  // El punto ya está en el flujo: el mapa se muestra sin esperar al reporte
  const location = analysis?.location ?? (isCurrentAnalysis ? flow.location : null)
  const neighborhood = neighborhoods.data?.[0] ?? null
  const surveyReady = isCurrentAnalysis && survey.status === 'ok'

  // Puntos del mapa: negocios del rubro según OpenStreetMap. Los locales de Google Places
  // van solo en la tabla: sus términos no permiten mostrarlos sobre un mapa que no es de Google.
  const nearbyPlaces = useNearbyPlaces({
    lat: location?.lat ?? null,
    lng: location?.lng ?? null,
    radius: location?.radius,
    category: analysis?.category.code ?? (isCurrentAnalysis ? categoryCode : null),
    subcategory: analysis?.subcategory.code ?? (isCurrentAnalysis ? subcategoryCode : null),
    match: surveyReady ? directMatch(survey.data, answers) : null,
  })

  const indicators = report.data?.indicators
  const noPublic = indicators?.competition?.status === 'not_applicable'

  const subtitle = analysis
    ? [analysis.subcategory.name, `radio de ${analysis.location.radius} m`, formatDate(analysis.createdAt)].join(' · ')
    : 'Consultando los datos de la zona que elegiste…'

  return (
    <div className="flow-step analisis">
      <Stepper steps={steps} current={4} />

      <StepHeading title="Análisis de la zona" subtitle={subtitle} />

      {surveyReady && (
        <BusinessSummary layout="inline" rows={buildSummaryRows(survey.data, answers)} editTo="/analizar/negocio" />
      )}

      {report.status === 'error' && (
        <div className="analisis-error">
          <StatusMessage variant="error">No pudimos analizar la zona: {report.error}</StatusMessage>
          <Button variant="secondary" size="m" onClick={report.retry}>
            Reintentar
          </Button>
        </div>
      )}

      <div className="analisis-grid">
        <div className="analisis-map-column">
          {/* Sin el contorno del barrio (si falló) el mapa se muestra igual, centrado en el punto */}
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
            <div className="flow-skeleton analisis-map-skeleton" aria-busy="true" aria-label="Cargando el mapa" />
          )}
          <ul className="analisis-legend" aria-label="Referencias del mapa">
            <li className="analisis-legend-item analisis-legend-item--direct">Competencia directa</li>
            <li className="analisis-legend-item">Otros locales del rubro</li>
          </ul>
        </div>

        {/* Si falló el pedido entero, el error ya se muestra arriba una sola vez */}
        {report.status !== 'error' && (
          <div className="analisis-cards">
            {noPublic ? (
              <p className="analisis-notice">
                <Icon name="info" size={18} />
                Como elegiste “Sin atención al público”, no mostramos competencia ni afluencia.
              </p>
            ) : (
              <>
                <CompetitionCard report={report} />
                <TrafficCard report={report} />
              </>
            )}
            <PopulationCard report={report} />
            <RentCard report={report} />
          </div>
        )}
      </div>

      {report.status === 'ok' && <DisclaimerCard compact />}

      <div className="flow-step-actions">
        {/* Un análisis de fuera del flujo en curso (ej. desde Mis reportes) no tiene paso anterior */}
        {isCurrentAnalysis && (
          <Button variant="secondary" to="/analizar/ubicacion">
            Anterior
          </Button>
        )}
        {report.status === 'ok' ? (
          <Button to={`/analizar/reporte/${id}`}>Ver reporte</Button>
        ) : (
          <Button disabled>Ver reporte</Button>
        )}
      </div>
    </div>
  )
}

export default Analisis
