import { useParams } from 'react-router-dom'
import { useFlowSteps } from '../../hooks/useFlowSteps.js'
import { useFlowAnalysisReport } from '../../hooks/useFlowAnalysisReport.js'
import Stepper from '../../components/organisms/Stepper/Stepper.jsx'
import CriteriaTable from '../../components/organisms/CriteriaTable/CriteriaTable.jsx'
import StepHeading from '../../components/molecules/StepHeading/StepHeading.jsx'
import StatusMessage from '../../components/molecules/StatusMessage/StatusMessage.jsx'
import StatTile from '../../components/molecules/StatTile/StatTile.jsx'
import DisclaimerCard from '../../components/molecules/DisclaimerCard/DisclaimerCard.jsx'
import Button from '../../components/atoms/Button/Button.jsx'
import { formatCurrency, formatDate, formatNumber } from '../../utils/formatters.js'
import { NEW_ANALYSIS_LINK } from '../../utils/flowSteps.js'
import './Reporte.css'

// Google Places devuelve como máximo 20 locales por consulta
const COMPETITION_MAX_RESULTS = 20

const PENDING_CAPTION = 'Dato pendiente'

// Cada dato de la zona según el estado de su indicador: ok, error, sin cobertura o no aplica
function competitionTile({ status, data }) {
  if (status === 'not_applicable') return { value: null, caption: 'No aplica sin atención al público' }
  if (status !== 'ok') return { value: null, caption: 'No pudimos cargar este dato' }
  const value = data.isExact
    ? formatNumber(data.total)
    : data.total >= COMPETITION_MAX_RESULTS
      ? `${data.total}+`
      : formatNumber(data.total)
  return { value, caption: `${data.directCount} directos` }
}

function trafficTile({ status, data }) {
  if (status === 'not_applicable') return { value: null, caption: 'No aplica sin atención al público' }
  if (status !== 'ok') return { value: null, caption: 'No pudimos cargar este dato' }
  return { value: `${data.score}/${data.scoreMax}`, caption: data.timeSlot }
}

function populationTile({ status, data }) {
  if (status !== 'ok') return { value: null, caption: 'No pudimos cargar este dato' }
  if (!data.inCoverage) return { value: null, caption: 'Fuera de la cobertura del censo' }
  return { value: formatNumber(data.poblacionEstimada), caption: 'habitantes en el radio' }
}

function rentTile({ status, data }) {
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

function Reporte() {
  const { id } = useParams()
  const steps = useFlowSteps()
  // Reusa el reporte que ya trajo el paso 4 (Análisis) si no cambió nada desde entonces
  const { status, data: report, error, retry, isCurrentAnalysis } = useFlowAnalysisReport(id)

  return (
    <div className="flow-step reporte">
      <Stepper steps={steps} current={5} />

      {status === 'ok' ? (
        <StepHeading
          title="Reporte de zona"
          subtitle={[
            report.analysis.category.name,
            report.analysis.subcategory.name,
            `radio ${report.analysis.location.radius} m`,
            formatDate(report.analysis.createdAt),
          ].join(' · ')}
        />
      ) : (
        <StepHeading title="Reporte de zona" />
      )}

      {status === 'loading' && (
        <div className="reporte-loading" aria-busy="true" aria-label="Generando el reporte">
          <div className="flow-skeleton" />
          <div className="flow-skeleton reporte-skeleton-tall" />
        </div>
      )}

      {status === 'error' && (
        <div className="reporte-error">
          <StatusMessage variant="error">No pudimos generar el reporte: {error}</StatusMessage>
          <Button variant="secondary" size="m" onClick={retry}>
            Reintentar
          </Button>
        </div>
      )}

      {status === 'ok' && (
        <>
          <section className="reporte-card" aria-labelledby="reporte-summary-title">
            <h2 id="reporte-summary-title" className="reporte-card-title">
              Resumen
            </h2>
            <p className="reporte-summary">{report.summary}</p>
          </section>

          <CriteriaTable criteria={report.criteria} />

          <section className="reporte-card" aria-labelledby="reporte-data-title">
            <h2 id="reporte-data-title" className="reporte-card-title">
              La zona en datos
            </h2>
            <div className="reporte-tiles">
              <StatTile label="Competencia" {...competitionTile(report.indicators.competition)} />
              <StatTile label="Afluencia (estimada)" {...trafficTile(report.indicators.traffic)} />
              <StatTile label="Población" {...populationTile(report.indicators.density)} />
              <StatTile label="Alquiler" {...rentTile(report.indicators.rent)} />
              <StatTile label="Accesibilidad" {...accessibilityTile(report.indicators.accessibility)} />
            </div>
          </section>

          <section className="reporte-card" aria-labelledby="reporte-sources-title">
            <h2 id="reporte-sources-title" className="reporte-card-title">
              Fuentes y avisos
            </h2>
            <ul className="reporte-notes">
              {[...report.notices, ...report.sources].map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </section>

          <DisclaimerCard />
        </>
      )}

      <div className="flow-step-actions">
        {/* Un reporte de otro análisis (ej. desde Mis reportes) no es parte del flujo en curso */}
        {isCurrentAnalysis && (
          <Button variant="secondary" to={`/analizar/analisis/${id}`}>
            Volver al análisis
          </Button>
        )}
        <Button variant="text" {...NEW_ANALYSIS_LINK}>
          Nuevo análisis
        </Button>
      </div>
    </div>
  )
}

export default Reporte
