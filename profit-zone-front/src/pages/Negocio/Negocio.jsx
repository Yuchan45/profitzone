import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useAnalysisFlow } from '../../hooks/useAnalysisFlow.js'
import { useFlowSteps } from '../../hooks/useFlowSteps.js'
import { useSubcategorySurvey } from '../../hooks/useSubcategorySurvey.js'
import { createAnalysis, replaceAnalysisAnswers } from '../../services/analyses.service.js'
import { FLOW_STEPS } from '../../utils/flowSteps.js'
import Stepper from '../../components/organisms/Stepper/Stepper.jsx'
import StepHeading from '../../components/molecules/StepHeading/StepHeading.jsx'
import StatusMessage from '../../components/molecules/StatusMessage/StatusMessage.jsx'
import SelectionSummary from '../../components/molecules/SelectionSummary/SelectionSummary.jsx'
import QuestionList from '../../components/organisms/QuestionList/QuestionList.jsx'
import Button from '../../components/atoms/Button/Button.jsx'
import './Negocio.css'

// El paso "Tu negocio" tiene dos secciones en la misma vista (el Stepper no avanza):
// 1. general: preguntas globales y de la categoría.
// 2. detalles (?seccion=detalles): preguntas específicas de la subcategoría.
const GENERAL_SCOPES = ['global', 'category']
const DETAILS_SCOPE = 'subcategory'
const DETAILS_SECTION = 'detalles'

function pluralize(count, singular, plural) {
  return count === 1 ? `1 ${singular}` : `${count} ${plural}`
}

function isAnswered(answers, questions) {
  return questions.filter((q) => q.isRequired).every((q) => answers[q.code]?.length > 0)
}

// Reemplaza las respuestas de un análisis ya guardado. Devuelve false si el análisis
// ya no existe en la API (404), para que se cree uno nuevo en su lugar.
async function replaceAnswersIfExists(analysisId, answers) {
  try {
    await replaceAnalysisAnswers(analysisId, answers)
    return true
  } catch (error) {
    if (error.response?.status === 404) return false
    throw error
  }
}

function Negocio() {
  const {
    analysisId,
    categoryCode,
    subcategoryCode,
    answers,
    setAnswer,
    setAnalysisId,
    setRequiredQuestions,
  } = useAnalysisFlow()
  const navigate = useNavigate()
  const [saveState, setSaveState] = useState({ status: 'idle', error: null })
  const steps = useFlowSteps()
  const [searchParams, setSearchParams] = useSearchParams()
  const { status, data, error } = useSubcategorySurvey(categoryCode, subcategoryCode)

  const allQuestions = status === 'ok' ? [...data.business, ...data.details] : []
  const generalQuestions = allQuestions.filter((q) => GENERAL_SCOPES.includes(q.scope))
  const detailQuestions = allQuestions.filter((q) => q.scope === DETAILS_SCOPE)

  // El paso queda completo con las obligatorias de las dos secciones (lo usa el Stepper).
  // String como dependencia: el array se crea en cada render.
  const requiredKey =
    status === 'ok'
      ? [...generalQuestions, ...detailQuestions]
          .filter((q) => q.isRequired)
          .map((q) => q.code)
          .join(',')
      : null

  useEffect(() => {
    if (requiredKey === null) return
    setRequiredQuestions('negocio', requiredKey ? requiredKey.split(',') : [])
  }, [requiredKey, setRequiredQuestions])

  // Sin rubro elegido (ej. entrada directa por URL) se vuelve al paso 1
  if (!categoryCode || !subcategoryCode) {
    return <Navigate to="/analizar/rubro" replace />
  }

  const generalComplete = isAnswered(answers, generalQuestions)
  const detailsComplete = isAnswered(answers, detailQuestions)
  const wantsDetails = searchParams.get('seccion') === DETAILS_SECTION

  // No se puede entrar a los detalles por URL sin completar antes la parte general
  if (wantsDetails && status === 'ok' && (!generalComplete || detailQuestions.length === 0)) {
    return <Navigate to="/analizar/negocio" replace />
  }

  const showDetails = wantsDetails && status === 'ok'

  // Al terminar el paso se guarda el análisis en la API: se crea la primera vez y,
  // si el usuario vuelve a cambiar respuestas, se reemplazan.
  const handleFinish = async () => {
    setSaveState({ status: 'saving', error: null })
    try {
      const replaced = analysisId && (await replaceAnswersIfExists(analysisId, answers))
      if (!replaced) {
        const analysis = await createAnalysis({ categoryCode, subcategoryCode, answers })
        setAnalysisId(analysis.id)
      }
      setSaveState({ status: 'idle', error: null })
      // El paso 3 (Ubicación) todavía no tiene vista: se avanza cuando tenga ruta
      const nextPath = FLOW_STEPS.find((step) => step.id === 'ubicacion').path
      if (nextPath) navigate(nextPath)
    } catch (error) {
      setSaveState({
        status: 'error',
        error: error.response?.data?.message ?? error.message,
      })
    }
  }
  const isSaving = saveState.status === 'saving'

  const goToSection = (section) => {
    setSearchParams(section ? { seccion: section } : {})
    window.scrollTo({ top: 0 })
  }

  // Con preguntas específicas el paso tiene 2 partes: se indica en qué parte está el
  // usuario, porque el Stepper no avanza entre una y otra.
  const totalParts = detailQuestions.length > 0 ? 2 : 1
  const part = totalParts > 1 ? { current: showDetails ? 2 : 1, total: totalParts } : null

  const heading = showDetails
    ? {
        title: `Detalles de tu ${data.subcategory.name.toLocaleLowerCase('es')}`,
        subtitle: `${pluralize(detailQuestions.length, 'pregunta específica', 'preguntas específicas')} de la subcategoría que elegiste.`,
      }
    : {
        title: 'Contanos cómo es tu negocio',
        subtitle:
          status === 'ok' && generalQuestions.length > 0
            ? `${pluralize(generalQuestions.length, 'pregunta rápida', 'preguntas rápidas')}. Cada respuesta cambia cómo leemos los datos de la zona.`
            : null,
      }

  return (
    <div className="flow-step">
      <Stepper steps={steps} current={2} />

      <StepHeading part={part} title={heading.title} subtitle={heading.subtitle} />

      {status === 'loading' && (
        <div className="flow-skeleton negocio-skeleton" aria-busy="true" aria-label="Cargando preguntas" />
      )}

      {status === 'error' && (
        <StatusMessage variant="error">No pudimos cargar las preguntas: {error}</StatusMessage>
      )}

      {showDetails && (
        <>
          <SelectionSummary
            label={`${data.category.name} · ${data.subcategory.name}`}
            actionTo="/analizar/rubro"
          />
          <QuestionList questions={detailQuestions} answers={answers} onAnswer={setAnswer} />
        </>
      )}

      {!showDetails && status === 'ok' && generalQuestions.length === 0 && (
        <StatusMessage>No hay preguntas generales para este rubro. Podés seguir al próximo paso.</StatusMessage>
      )}

      {!showDetails && status === 'ok' && generalQuestions.length > 0 && (
        <QuestionList questions={generalQuestions} answers={answers} onAnswer={setAnswer} />
      )}

      {saveState.status === 'error' && (
        <StatusMessage variant="error">No pudimos guardar tus respuestas: {saveState.error}</StatusMessage>
      )}

      <div className="flow-step-actions">
        {showDetails ? (
          <Button variant="secondary" onClick={() => goToSection(null)}>
            Anterior
          </Button>
        ) : (
          <Button variant="secondary" to="/analizar/rubro">
            Anterior
          </Button>
        )}

        {showDetails ? (
          <Button variant="primary" disabled={!detailsComplete || isSaving} onClick={handleFinish}>
            {isSaving ? 'Guardando…' : 'Siguiente'}
          </Button>
        ) : (
          <Button
            variant="primary"
            disabled={status !== 'ok' || !generalComplete || isSaving}
            // Sin preguntas específicas no hay sección de detalles: el paso termina acá
            onClick={detailQuestions.length > 0 ? () => goToSection(DETAILS_SECTION) : handleFinish}
          >
            {isSaving ? 'Guardando…' : 'Siguiente'}
          </Button>
        )}
      </div>
    </div>
  )
}

export default Negocio
