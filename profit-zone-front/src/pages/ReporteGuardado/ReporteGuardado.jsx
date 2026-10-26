import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAnalysisReport } from '../../hooks/useAnalysisReport.js'
import { useAnalysisActions } from '../../hooks/useAnalysisActions.js'
import CriteriaTable from '../../components/organisms/CriteriaTable/CriteriaTable.jsx'
import ZoneReport from '../../components/organisms/ZoneReport/ZoneReport.jsx'
import StepHeading from '../../components/molecules/StepHeading/StepHeading.jsx'
import EditableName from '../../components/molecules/EditableName/EditableName.jsx'
import StatusMessage from '../../components/molecules/StatusMessage/StatusMessage.jsx'
import Button from '../../components/atoms/Button/Button.jsx'
import Icon from '../../components/atoms/Icon/Icon.jsx'
import { formatDate } from '../../utils/formatters.js'
import { ANALYSIS_NAME_MAX_LENGTH } from '../../utils/analysisName.js'
import './ReporteGuardado.css'

/**
 * Reporte de un análisis guardado, abierto desde Mis reportes. Es parte del
 * historial, no del flujo: sin Stepper ni acciones del análisis en curso.
 */
function ReporteGuardado() {
  const { id } = useParams()
  // Sin reusar la caché de la pestaña: si el análisis se editó en el flujo, la copia
  // guardada quedaría vieja (la caché no se invalida al guardar respuestas o ubicación)
  const { status, data: report, error, retry } = useAnalysisReport(id)
  const actions = useAnalysisActions()
  // Nombre recién guardado: se muestra sin volver a pedir el reporte (consulta fuentes pagas)
  const [savedName, setSavedName] = useState(undefined)

  const analysis = report?.analysis
  const name = savedName !== undefined ? savedName : analysis?.name

  const saveName = async (newName) => {
    const saved = await actions.rename(id, newName)
    if (saved) setSavedName(newName || null)
    return saved
  }

  return (
    <section className="reporte-guardado">
      <Link to="/mis-reportes" className="reporte-guardado-back">
        <Icon name="arrow-left" size={16} />
        Volver a Mis reportes
      </Link>

      {status === 'ok' ? (
        <StepHeading
          heading={
            <EditableName
              as="h1"
              textClassName="step-heading-title"
              value={name}
              placeholder="Reporte de zona"
              maxLength={ANALYSIS_NAME_MAX_LENGTH}
              saving={actions.pendingId === id}
              error={actions.errorFor('rename', id)}
              onSave={saveName}
              onCancel={actions.clearError}
            />
          }
          subtitle={[
            analysis.category.name,
            analysis.subcategory.name,
            analysis.address,
            `radio ${analysis.location.radius} m`,
            formatDate(analysis.createdAt),
          ]
            .filter(Boolean)
            .join(' · ')}
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
