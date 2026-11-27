import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAnalysisReport } from '../../hooks/useAnalysisReport.js'
import { useAnalysisActions } from '../../hooks/useAnalysisActions.js'
import ZoneAnalysis from '../../components/organisms/ZoneAnalysis/ZoneAnalysis.jsx'
import StepHeading from '../../components/molecules/StepHeading/StepHeading.jsx'
import EditableName from '../../components/molecules/EditableName/EditableName.jsx'
import StatusMessage from '../../components/molecules/StatusMessage/StatusMessage.jsx'
import Button from '../../components/atoms/Button/Button.jsx'
import Icon from '../../components/atoms/Icon/Icon.jsx'
import { upgradeAnalysis } from '../../services/analyses.service.js'
import { formatDate } from '../../utils/formatters.js'
import { ANALYSIS_NAME_MAX_LENGTH } from '../../utils/analysisName.js'
import './ReporteGuardado.css'

/**
 * Reporte de un análisis guardado, abierto desde Mis reportes. Muestra lo mismo que el
 * paso 4 del flujo (ZoneAnalysis), pero es parte del historial: sin Stepper ni acciones
 * del análisis en curso, y con el nombre editable.
 */
function ReporteGuardado() {
  const { id } = useParams()
  // Sin reusar la caché de la pestaña: si el análisis se editó en el flujo, la copia
  // guardada quedaría vieja (la caché no se invalida al guardar respuestas o ubicación)
  const report = useAnalysisReport(id)
  const actions = useAnalysisActions()
  // Nombre recién guardado: se muestra sin volver a pedir el reporte (consulta fuentes pagas)
  const [savedName, setSavedName] = useState(undefined)

  // Reporte básico bloqueado: se desbloquea mejorándolo a completo (1 crédito pago)
  const [upgrading, setUpgrading] = useState(false)
  const [upgradeError, setUpgradeError] = useState(null)
  const upgrade = async () => {
    setUpgrading(true)
    setUpgradeError(null)
    try {
      await upgradeAnalysis(id)
      report.retry()
    } catch (error) {
      setUpgradeError(error.response?.data?.message ?? error.message)
    } finally {
      setUpgrading(false)
    }
  }

  const analysis = report.data?.analysis
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

      {report.status === 'ok' ? (
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

      {report.status === 'error' && report.code === 'REPORT_LOCKED' ? (
        <div className="reporte-guardado-locked">
          <StatusMessage>
            Este reporte básico quedó bloqueado: solo el último análisis básico se puede reabrir gratis. Mejoralo a
            completo con 1 crédito pago para verlo de nuevo, con Google, alquileres y PDF.
          </StatusMessage>
          {upgradeError && <StatusMessage variant="error">No pudimos mejorarlo: {upgradeError}</StatusMessage>}
          <div className="reporte-guardado-locked-actions">
            <Button variant="primary" size="m" onClick={upgrade} disabled={upgrading}>
              {upgrading ? 'Mejorando…' : 'Mejorar a completo · 1 crédito'}
            </Button>
            <Button variant="secondary" size="m" to="/creditos">
              Comprar créditos
            </Button>
          </div>
        </div>
      ) : (
        <ZoneAnalysis report={report} />
      )}
    </section>
  )
}

export default ReporteGuardado
