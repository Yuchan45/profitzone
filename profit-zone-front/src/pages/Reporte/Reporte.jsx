import { useParams } from 'react-router-dom'
import { useFlowSteps } from '../../hooks/useFlowSteps.js'
import { useFlowAnalysisReport } from '../../hooks/useFlowAnalysisReport.js'
import Stepper from '../../components/organisms/Stepper/Stepper.jsx'
import CriteriaTable from '../../components/organisms/CriteriaTable/CriteriaTable.jsx'
import ZoneReport from '../../components/organisms/ZoneReport/ZoneReport.jsx'
import StepHeading from '../../components/molecules/StepHeading/StepHeading.jsx'
import StatusMessage from '../../components/molecules/StatusMessage/StatusMessage.jsx'
import Button from '../../components/atoms/Button/Button.jsx'
import { formatDate } from '../../utils/formatters.js'
import { NEW_ANALYSIS_LINK } from '../../utils/flowSteps.js'
import './Reporte.css'

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
        <ZoneReport report={report}>
          <CriteriaTable criteria={report.criteria} />
        </ZoneReport>
      )}

      <div className="flow-step-actions">
        {/* Un reporte de otro análisis (ej. abierto por link directo) no es parte del flujo en curso */}
        {isCurrentAnalysis && (
          <Button variant="secondary" to={`/analizar/analisis/${id}`}>
            Volver al análisis
          </Button>
        )}
        <div className="reporte-actions-end">
          <Button variant="text" {...NEW_ANALYSIS_LINK}>
            Nuevo análisis
          </Button>
          {/* El reporte ya quedó guardado al analizar la zona */}
          <Button variant="primary" to="/mis-reportes">
            Ir a Mis reportes
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Reporte
