import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMyAnalyses } from '../../hooks/useMyAnalyses.js'
import { useAnalysisActions } from '../../hooks/useAnalysisActions.js'
import StepHeading from '../../components/molecules/StepHeading/StepHeading.jsx'
import StatusMessage from '../../components/molecules/StatusMessage/StatusMessage.jsx'
import SegmentedNav from '../../components/molecules/SegmentedNav/SegmentedNav.jsx'
import ReportCard from '../../components/molecules/ReportCard/ReportCard.jsx'
import EditableName from '../../components/molecules/EditableName/EditableName.jsx'
import Modal from '../../components/organisms/Modal/Modal.jsx'
import Button from '../../components/atoms/Button/Button.jsx'
import { categoryIcon } from '../../utils/categoryIcons.js'
import { formatDate } from '../../utils/formatters.js'
import { NEW_ANALYSIS_LINK } from '../../utils/flowSteps.js'
import { ANALYSIS_NAME_MAX_LENGTH } from '../../utils/analysisName.js'
import './MisReportes.css'

// La pestaña va en la URL (?estado=borradores): sobrevive a un refresh y al volver atrás
const TABS = [
  { label: 'Reportes', value: 'saved' },
  { label: 'Borradores', value: 'draft' },
]

const EMPTY_MESSAGES = {
  saved: 'Todavía no tenés reportes. Cuando analices una zona, el reporte va a quedar acá.',
  draft: 'No tenés borradores. Si salís de un análisis antes de analizar la zona, podés guardarlo acá para continuarlo después.',
}

// Con nombre propio, el rubro baja a la línea de detalle; sin nombre, el título es el rubro
function analysisTitle(analysis) {
  return analysis.name ?? analysis.subcategory.name
}

// Rubro · dirección · radio. La dirección distingue análisis del mismo rubro
function analysisDetails(analysis) {
  const rubro = analysis.name ? analysis.subcategory.name : analysis.category.name
  if (!analysis.location) return `${rubro} · sin ubicación`
  return [rubro, analysis.address, `radio ${analysis.location.radius} m`].filter(Boolean).join(' · ')
}

function MisReportes() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('estado') === 'borradores' ? 'draft' : 'saved'
  const { status, data, error, reload } = useMyAnalyses(tab)
  const actions = useAnalysisActions()
  // Reporte o borrador a eliminar: se confirma en un modal
  const [toDelete, setToDelete] = useState(null)
  const deleteNoun = toDelete?.status === 'saved' ? 'reporte' : 'borrador'
  // Nombres guardados en esta pantalla: se muestran sin volver a pedir la lista
  // (así tampoco cambia el orden mientras el usuario renombra)
  const [savedNames, setSavedNames] = useState({})

  const analyses = data?.map((analysis) =>
    analysis.id in savedNames ? { ...analysis, name: savedNames[analysis.id] } : analysis,
  )

  const changeTab = (value) => {
    setSearchParams(value === 'draft' ? { estado: 'borradores' } : {}, { replace: true })
  }

  const confirmDelete = async () => {
    if (await actions.remove(toDelete.id)) {
      setToDelete(null)
      reload()
    }
  }

  const closeDelete = () => {
    setToDelete(null)
    actions.clearError()
  }

  const saveName = (analysisId) => async (name) => {
    const saved = await actions.rename(analysisId, name)
    if (saved) setSavedNames((prev) => ({ ...prev, [analysisId]: name || null }))
    return saved
  }

  const resumeError = actions.error?.action === 'resume' ? actions.error.message : null

  return (
    <section className="mis-reportes">
      <div className="mis-reportes-header">
        <StepHeading
          title="Mis reportes"
          subtitle="Tus reportes guardados y los análisis que dejaste sin terminar."
        />
        <Button variant="primary" size="m" {...NEW_ANALYSIS_LINK}>
          Nuevo análisis
        </Button>
      </div>

      <SegmentedNav items={TABS} label="Reportes o borradores" value={tab} onChange={changeTab} />

      {resumeError && <StatusMessage variant="error">No pudimos abrir el borrador: {resumeError}</StatusMessage>}

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

      {status === 'ok' && analyses.length === 0 && <StatusMessage>{EMPTY_MESSAGES[tab]}</StatusMessage>}

      {status === 'ok' && analyses.length > 0 && (
        <ul className="mis-reportes-list">
          {analyses.map((analysis) => (
            <li key={analysis.id}>
              <ReportCard
                icon={categoryIcon(analysis.category.code)}
                title={
                  <EditableName
                    value={analysis.name}
                    placeholder={analysis.subcategory.name}
                    maxLength={ANALYSIS_NAME_MAX_LENGTH}
                    saving={actions.pendingId === analysis.id}
                    error={actions.errorFor('rename', analysis.id)}
                    onSave={saveName(analysis.id)}
                    onCancel={actions.clearError}
                  />
                }
                linkLabel={`Abrir el reporte ${analysisTitle(analysis)}`}
                details={analysisDetails(analysis)}
                date={formatDate(analysis.updatedAt)}
                status={analysis.status}
                // La flecha sigue el análisis: abre el reporte o continúa el borrador
                {...(analysis.status === 'saved'
                  ? { to: `/mis-reportes/${analysis.id}`, openLabel: 'Ver reporte' }
                  : {
                      onOpen: () => actions.resume(analysis.id),
                      openLabel: 'Continuar análisis',
                      openDisabled: actions.pendingId === analysis.id,
                    })}
                actions={
                  <Button
                    variant="danger"
                    size="m"
                    onClick={() => setToDelete(analysis)}
                    disabled={actions.pendingId === analysis.id}
                  >
                    Eliminar
                  </Button>
                }
              />
            </li>
          ))}
        </ul>
      )}

      <Modal open={Boolean(toDelete)} onClose={closeDelete} title={`¿Eliminar el ${deleteNoun}?`}>
        <p className="mis-reportes-modal-text">
          {toDelete && `Se va a eliminar "${analysisTitle(toDelete)}". No se puede deshacer.`}
        </p>
        {toDelete && actions.errorFor('remove', toDelete.id) && (
          <StatusMessage variant="error">{actions.errorFor('remove', toDelete.id)}</StatusMessage>
        )}
        <div className="mis-reportes-modal-actions">
          <Button variant="text" size="m" onClick={closeDelete}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            size="m"
            onClick={confirmDelete}
            disabled={actions.pendingId === toDelete?.id}
          >
            Eliminar
          </Button>
        </div>
      </Modal>
    </section>
  )
}

export default MisReportes
