import { useMyAnalyses } from '../../hooks/useMyAnalyses.js'
import StepHeading from '../../components/molecules/StepHeading/StepHeading.jsx'
import StatusMessage from '../../components/molecules/StatusMessage/StatusMessage.jsx'
import ReportCard from '../../components/molecules/ReportCard/ReportCard.jsx'
import Button from '../../components/atoms/Button/Button.jsx'
import { categoryIcon } from '../../utils/categoryIcons.js'
import { formatDate } from '../../utils/formatters.js'
import { NEW_ANALYSIS_LINK } from '../../utils/flowSteps.js'
import './MisReportes.css'

function MisReportes() {
  const { status, data: analyses, error } = useMyAnalyses()

  return (
    <section className="mis-reportes">
      <div className="mis-reportes-header">
        <StepHeading
          title="Mis reportes"
          subtitle="Los análisis que guardaste. Abrí uno para volver a ver el reporte de la zona."
        />
        {status === 'ok' && analyses.length > 0 && (
          <Button variant="primary" size="m" {...NEW_ANALYSIS_LINK}>
            Nuevo análisis
          </Button>
        )}
      </div>

      {status === 'loading' && (
        <div className="mis-reportes-list" aria-busy="true" aria-label="Cargando tus reportes">
          <div className="flow-skeleton mis-reportes-skeleton" />
          <div className="flow-skeleton mis-reportes-skeleton" />
          <div className="flow-skeleton mis-reportes-skeleton" />
        </div>
      )}

      {status === 'error' && (
        <StatusMessage variant="error">No pudimos cargar tus reportes: {error}</StatusMessage>
      )}

      {status === 'ok' && analyses.length === 0 && (
        <div className="mis-reportes-empty">
          <StatusMessage>
            Todavía no guardaste ningún análisis. Cuando analices una zona, el reporte va a
            quedar acá.
          </StatusMessage>
          <Button variant="primary" {...NEW_ANALYSIS_LINK}>
            Analizar una zona
          </Button>
        </div>
      )}

      {status === 'ok' && analyses.length > 0 && (
        <ul className="mis-reportes-list">
          {analyses.map((analysis) => (
            <li key={analysis.id}>
              <ReportCard
                icon={categoryIcon(analysis.category.code)}
                title={analysis.subcategory.name}
                details={`${analysis.category.name} · radio ${analysis.location.radius} m`}
                date={formatDate(analysis.updatedAt)}
                to={`/mis-reportes/${analysis.id}`}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default MisReportes
