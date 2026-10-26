import { Link } from 'react-router-dom'
import { useSampleReport } from '../../hooks/useSampleReport.js'
import { useSubcategorySurvey } from '../../hooks/useSubcategorySurvey.js'
import ZoneAnalysis from '../../components/organisms/ZoneAnalysis/ZoneAnalysis.jsx'
import BusinessSummary from '../../components/organisms/BusinessSummary/BusinessSummary.jsx'
import StepHeading from '../../components/molecules/StepHeading/StepHeading.jsx'
import StatusMessage from '../../components/molecules/StatusMessage/StatusMessage.jsx'
import Badge from '../../components/atoms/Badge/Badge.jsx'
import Button from '../../components/atoms/Button/Button.jsx'
import Icon from '../../components/atoms/Icon/Icon.jsx'
import { buildSummaryRows, directMatch } from '../../utils/surveySummary.js'
import { NEW_ANALYSIS_LINK } from '../../utils/flowSteps.js'
import './ReporteEjemplo.css'

/**
 * Reporte de ejemplo ("Ver reporte de ejemplo" en la home): un restaurante de cocina
 * asiática en Palermo Soho. Público, sin sesión. Muestra lo mismo que el paso 4 del
 * flujo (ZoneAnalysis) con el perfil del negocio del ejemplo.
 */
function ReporteEjemplo() {
  const report = useSampleReport()
  const sample = report.data
  const business = sample?.business
  // La encuesta del rubro traduce las respuestas del ejemplo a texto y marca la competencia directa
  const survey = useSubcategorySurvey(business?.categoryCode ?? null, business?.subcategoryCode ?? null)
  const surveyReady = Boolean(business) && survey.status === 'ok'

  const analysis = sample?.analysis
  const subtitle = analysis
    ? [analysis.subcategory.name, analysis.address, 'Palermo', `radio ${analysis.location.radius} m`].join(' · ')
    : 'Cargando el ejemplo…'

  return (
    <section className="reporte-ejemplo">
      <Link to="/" className="reporte-ejemplo-back">
        <Icon name="arrow-left" size={16} />
        Volver al inicio
      </Link>

      <div className="reporte-ejemplo-header">
        <Badge variant="strength">Reporte de ejemplo</Badge>
        <StepHeading title={analysis?.name ?? 'Reporte de ejemplo'} subtitle={subtitle} />
        <StatusMessage>
          Así se ve un análisis completo en ProfitZone. Los nombres de los locales son ficticios; el
          resto de los datos sale de una consulta real.
        </StatusMessage>
      </div>

      {surveyReady && (
        <BusinessSummary
          layout="inline"
          title="El negocio del ejemplo"
          rows={buildSummaryRows(survey.data, business.answers)}
        />
      )}

      {/* Datos guardados de una consulta pasada: las fuentes no dicen "en vivo" */}
      <ZoneAnalysis
        report={report}
        match={surveyReady ? directMatch(survey.data, business.answers) : null}
        live={false}
      />

      <div className="reporte-ejemplo-cta">
        <p className="reporte-ejemplo-cta-text">¿Querés ver el de tu negocio?</p>
        <Button {...NEW_ANALYSIS_LINK}>Analizar una zona</Button>
      </div>
    </section>
  )
}

export default ReporteEjemplo
