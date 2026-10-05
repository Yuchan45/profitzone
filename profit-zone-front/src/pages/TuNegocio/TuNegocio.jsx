import { useAnalysis } from '../../hooks/useAnalysis.js'
import Stepper from '../../components/organisms/Stepper/Stepper.jsx'
import Button from '../../components/atoms/Button/Button.jsx'
import { ANALYSIS_PATHS, ANALYSIS_STEPS } from '../../utils/analysisSteps.js'
import './TuNegocio.css'

// Placeholder del paso 2: la encuesta se implementa en PZ-14.
function TuNegocio() {
  const { analysis } = useAnalysis()

  return (
    <div className="tu-negocio">
      <Stepper steps={ANALYSIS_STEPS} current={2} />

      <header className="tu-negocio-heading">
        <h1 className="tu-negocio-title">Contanos cómo es tu negocio</h1>
        <p className="tu-negocio-subtitle">
          Rubro elegido: {analysis.category.name} · {analysis.subcategory.name}
        </p>
      </header>

      <p className="tu-negocio-message">Las preguntas de este paso todavía están en desarrollo.</p>

      <div className="tu-negocio-actions">
        <Button variant="secondary" to={ANALYSIS_PATHS.rubro}>
          Anterior
        </Button>
        <Button variant="primary" to={ANALYSIS_PATHS.detalles}>
          Siguiente
        </Button>
      </div>
    </div>
  )
}

export default TuNegocio
