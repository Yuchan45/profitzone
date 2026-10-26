import { useParams } from 'react-router-dom'
import { useAnalysisFlow } from '../../hooks/useAnalysisFlow.js'
import { useFlowSteps } from '../../hooks/useFlowSteps.js'
import { useFlowAnalysisReport } from '../../hooks/useFlowAnalysisReport.js'
import { useSubcategorySurvey } from '../../hooks/useSubcategorySurvey.js'
import { useNavigationToast } from '../../hooks/useNavigationToast.js'
import Toast from '../../components/molecules/Toast/Toast.jsx'
import Stepper from '../../components/organisms/Stepper/Stepper.jsx'
import BusinessSummary from '../../components/organisms/BusinessSummary/BusinessSummary.jsx'
import ZoneAnalysis from '../../components/organisms/ZoneAnalysis/ZoneAnalysis.jsx'
import StepHeading from '../../components/molecules/StepHeading/StepHeading.jsx'
import Button from '../../components/atoms/Button/Button.jsx'
import { formatDate } from '../../utils/formatters.js'
import { buildSummaryRows, directMatch } from '../../utils/surveySummary.js'
import { NEW_ANALYSIS_LINK } from '../../utils/flowSteps.js'
import './Analisis.css'

// Paso 4 del flujo: el análisis y el reporte de la zona (ZoneAnalysis), con "Tu negocio"
// y las acciones del flujo. El mismo contenido se ve en Mis reportes (ReporteGuardado).
function Analisis() {
  const { id } = useParams()
  const flow = useAnalysisFlow()
  const { categoryCode, subcategoryCode, answers } = flow
  const steps = useFlowSteps()
  const report = useFlowAnalysisReport(id)
  // "Analizar zona" guarda el reporte y llega con el aviso
  const toast = useNavigationToast()

  // Solo el análisis en curso tiene sus respuestas en el flujo (un reporte viejo no)
  const { isCurrentAnalysis } = report
  const survey = useSubcategorySurvey(
    isCurrentAnalysis ? categoryCode : null,
    isCurrentAnalysis ? subcategoryCode : null,
  )
  const surveyReady = isCurrentAnalysis && survey.status === 'ok'

  const analysis = report.data?.analysis
  const subtitle = analysis
    ? [
        analysis.category.name,
        analysis.subcategory.name,
        `radio de ${analysis.location.radius} m`,
        formatDate(analysis.createdAt),
      ]
        .filter(Boolean)
        .join(' · ')
    : 'Consultando los datos de la zona que elegiste…'

  return (
    <div className="flow-step analisis">
      <Toast message={toast.message} onClose={toast.close} />
      <Stepper steps={steps} current={4} />

      <StepHeading title="Análisis de la zona" subtitle={subtitle} />

      {surveyReady && (
        <BusinessSummary layout="inline" rows={buildSummaryRows(survey.data, answers)} editTo="/analizar/negocio" />
      )}

      <ZoneAnalysis
        report={report}
        // El punto ya está en el flujo: el mapa se muestra sin esperar al reporte
        point={isCurrentAnalysis ? flow.location : null}
        categoryCode={isCurrentAnalysis ? categoryCode : null}
        subcategoryCode={isCurrentAnalysis ? subcategoryCode : null}
        match={surveyReady ? directMatch(survey.data, answers) : null}
        serviceMode={isCurrentAnalysis ? (answers.service_mode?.[0] ?? null) : null}
      />

      <div className="flow-step-actions">
        {/* Un análisis de fuera del flujo en curso (ej. abierto por link directo) no tiene paso anterior */}
        {isCurrentAnalysis && (
          <Button variant="secondary" to="/analizar/ubicacion">
            Anterior
          </Button>
        )}
        <div className="analisis-actions-end">
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

export default Analisis
