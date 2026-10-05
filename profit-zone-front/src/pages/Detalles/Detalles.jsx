import { Link, useNavigate } from 'react-router-dom'
import { useAnalysis } from '../../hooks/useAnalysis.js'
import { useSubcategorySurvey } from '../../hooks/useSubcategorySurvey.js'
import Stepper from '../../components/organisms/Stepper/Stepper.jsx'
import Survey from '../../components/organisms/Survey/Survey.jsx'
import Button from '../../components/atoms/Button/Button.jsx'
import { ANALYSIS_PATHS, ANALYSIS_STEPS } from '../../utils/analysisSteps.js'
import './Detalles.css'

// Paso 2b: preguntas específicas de la subcategoría elegida en el paso 1.
function Detalles() {
  const navigate = useNavigate()
  const { analysis, setAnswer } = useAnalysis()
  const { category, subcategory, answers } = analysis
  const { status, data: survey, error } = useSubcategorySurvey(category.code, subcategory.code)

  // `details` son las preguntas propias de la subcategoría (las generales, `business`, van en el paso 2)
  const questions = survey?.details ?? []
  const isComplete = questions.every((q) => !q.isRequired || answers[q.code]?.length > 0)
  const canContinue = status === 'ok' && isComplete

  return (
    <div className="detalles">
      <Stepper steps={ANALYSIS_STEPS} current={2} />

      <header className="detalles-heading">
        <h1 className="detalles-title">Detalles de tu {subcategory.name.toLowerCase()}</h1>
        {status === 'ok' && questions.length > 0 && (
          <p className="detalles-subtitle">
            {questions.length === 1
              ? '1 pregunta específica de la subcategoría que elegiste.'
              : `${questions.length} preguntas específicas de la subcategoría que elegiste.`}
          </p>
        )}
      </header>

      <p className="detalles-rubro">
        <span className="detalles-rubro-name">
          {category.name} · {subcategory.name}
        </span>
        <Link to={ANALYSIS_PATHS.rubro} className="detalles-rubro-change">
          Cambiar
        </Link>
      </p>

      {status === 'loading' && (
        <div className="detalles-skeleton" aria-busy="true" aria-label="Cargando preguntas" />
      )}

      {status === 'error' && (
        <p className="detalles-message detalles-message--error" role="alert">
          No pudimos cargar las preguntas: {error}
        </p>
      )}

      {status === 'ok' && questions.length === 0 && (
        <p className="detalles-message">
          Esta subcategoría no tiene preguntas específicas. Podés seguir al próximo paso.
        </p>
      )}

      {status === 'ok' && questions.length > 0 && (
        <Survey questions={questions} answers={answers} onAnswer={setAnswer} />
      )}

      <div className="detalles-actions">
        <Button variant="secondary" to={ANALYSIS_PATHS.negocio}>
          Anterior
        </Button>
        <Button
          variant="primary"
          disabled={!canContinue}
          onClick={() => navigate(ANALYSIS_PATHS.ubicacion)}
        >
          Siguiente
        </Button>
      </div>
    </div>
  )
}

export default Detalles
