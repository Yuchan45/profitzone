import { Link, useParams } from 'react-router-dom'
import { useAnalysisReport } from '../../hooks/useAnalysisReport.js'
import CriteriaTable from '../../components/organisms/CriteriaTable/CriteriaTable.jsx'
import ZoneReport from '../../components/organisms/ZoneReport/ZoneReport.jsx'
import StepHeading from '../../components/molecules/StepHeading/StepHeading.jsx'
import StatusMessage from '../../components/molecules/StatusMessage/StatusMessage.jsx'
import Button from '../../components/atoms/Button/Button.jsx'
import Icon from '../../components/atoms/Icon/Icon.jsx'
import { formatDate } from '../../utils/formatters.js'
import './ReporteGuardado.css'

/**
 * Reporte de un análisis guardado, abierto desde Mis reportes. Es parte del
 * historial, no del flujo: sin Stepper ni acciones del análisis en curso.
 */
function ReporteGuardado() {
  const { id } = useParams()
  // Si el reporte ya se trajo en esta pestaña, se reusa: armarlo consulta fuentes pagas
  const { status, data: report, error, retry } = useAnalysisReport(id, { reuse: true })

  return (
    <section className="reporte-guardado">
      <Link to="/mis-reportes" className="reporte-guardado-back">
        <Icon name="arrow-left" size={16} />
        Volver a Mis reportes
      </Link>

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
        <div className="reporte-guardado-loading" aria-busy="true" aria-label="Cargando el reporte">
          <div className="flow-skeleton" />
          <div className="flow-skeleton reporte-guardado-skeleton-tall" />
        </div>
      )}

      {status === 'error' && (
        <div className="reporte-guardado-error">
          <StatusMessage variant="error">No pudimos cargar el reporte: {error}</StatusMessage>
          <Button variant="secondary" size="m" onClick={retry}>
            Reintentar
          </Button>
        </div>
      )}

      {status === 'ok' && (
        <ZoneReport report={report}>
          <CriteriaTable criteria={report.criteria} />
        </ZoneReport>
      )}
    </section>
  )
}

export default ReporteGuardado
