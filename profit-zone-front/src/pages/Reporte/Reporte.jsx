import { useParams } from 'react-router-dom'
import { useFlowSteps } from '../../hooks/useFlowSteps.js'
import { useAnalysisReport } from '../../hooks/useAnalysisReport.js'
import Stepper from '../../components/organisms/Stepper/Stepper.jsx'
import CriteriaTable from '../../components/organisms/CriteriaTable/CriteriaTable.jsx'
import StepHeading from '../../components/molecules/StepHeading/StepHeading.jsx'
import StatusMessage from '../../components/molecules/StatusMessage/StatusMessage.jsx'
import StatTile from '../../components/molecules/StatTile/StatTile.jsx'
import Button from '../../components/atoms/Button/Button.jsx'
import { formatCurrency, formatDate, formatNumber } from '../../utils/formatters.js'
import './Reporte.css'

// Google Places devuelve como máximo 20 locales por consulta
const COMPETITION_MAX_RESULTS = 20

const PENDING_CAPTION = 'Dato pendiente'

// Cada dato de la zona según el estado de su indicador: ok, error, sin cobertura o no aplica
function competitionTile({ status, data }) {
  if (status === 'not_applicable') return { value: null, caption: 'No aplica sin atención al público' }
  if (status !== 'ok') return { value: null, caption: 'No pudimos cargar este dato' }
  const value = data.total >= COMPETITION_MAX_RESULTS ? `${data.total}+` : formatNumber(data.total)
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
  // Solo los avisos con precio forman la mediana
  if (data.pricedInRadius === 0) return { value: null, caption: 'Sin locales en alquiler publicados en el radio' }
  const listings = data.pricedInRadius === 1 ? '1 aviso' : `${formatNumber(data.pricedInRadius)} avisos`
  return {
    value: formatCurrency(data.medianRentArs, 'ARS', { decimals: 0 }),
    caption: `por mes, mediana de ${listings}`,
  }
}

function Reporte() {
  const { id } = useParams()
  const steps = useFlowSteps()
  const { status, data: report, error } = useAnalysisReport(id)

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
        <StatusMessage variant="error">No pudimos generar el reporte: {error}</StatusMessage>
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
              <StatTile label="Accesibilidad" value={null} caption={PENDING_CAPTION} />
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
        </>
      )}

      <div className="flow-step-actions">
        <Button variant="secondary" to="/analizar/negocio">
          Editar respuestas
        </Button>
        <Button variant="text" to="/analizar/rubro">
          Nuevo análisis
        </Button>
      </div>
    </div>
  )
}

export default Reporte
