import { useNavigate } from 'react-router-dom'
import { useCategories } from '../../hooks/useCategories.js'
import { useAnalysisFlow } from '../../hooks/useAnalysisFlow.js'
import { useFlowSteps } from '../../hooks/useFlowSteps.js'
import Stepper from '../../components/organisms/Stepper/Stepper.jsx'
import StepHeading from '../../components/molecules/StepHeading/StepHeading.jsx'
import StatusMessage from '../../components/molecules/StatusMessage/StatusMessage.jsx'
import CategoryCard from '../../components/molecules/CategoryCard/CategoryCard.jsx'
import Chip from '../../components/atoms/Chip/Chip.jsx'
import Button from '../../components/atoms/Button/Button.jsx'
import './Rubro.css'

// La API no trae íconos: se asignan por code de categoría.
const CATEGORY_ICONS = {
  gastronomia: 'store',
  fitness: 'dumbbell',
}
const DEFAULT_CATEGORY_ICON = 'store'

function Rubro() {
  const navigate = useNavigate()
  // La selección vive en el contexto del flujo: así el Stepper sabe si este paso
  // está completo y, al volver desde otro paso, queda marcado lo que se eligió.
  const { categoryCode, subcategoryCode, setRubro } = useAnalysisFlow()
  const steps = useFlowSteps()
  const { status, data: categories, error } = useCategories()

  // Hasta que el usuario elija, queda seleccionada la primera categoría
  const category = categories?.find((c) => c.code === categoryCode) ?? categories?.[0] ?? null
  // Solo vale si pertenece a la categoría mostrada (puede haberse desactivado)
  const subcategory = category?.subcategories.find((s) => s.code === subcategoryCode) ?? null

  const handleSelectCategory = (code) => {
    if (code === category?.code) return
    // Cambiar de rubro invalida la subcategoría y las respuestas de los pasos siguientes
    setRubro(code, null)
  }

  return (
    <div className="flow-step">
      <Stepper steps={steps} current={1} />

      <StepHeading
        title="¿Qué querés abrir?"
        subtitle="Elegí el rubro y la subcategoría. Con eso definimos qué locales cuentan como competencia en la zona."
      />

      {status === 'loading' && (
        <div className="rubro-categories" aria-busy="true" aria-label="Cargando rubros">
          <div className="flow-skeleton" />
          <div className="flow-skeleton" />
        </div>
      )}

      {status === 'error' && (
        <StatusMessage variant="error">No pudimos cargar los rubros: {error}</StatusMessage>
      )}

      {status === 'ok' && categories.length === 0 && (
        <StatusMessage>Todavía no hay rubros disponibles.</StatusMessage>
      )}

      {status === 'ok' && category && (
        <>
          <div className="rubro-categories">
            {categories.map((c) => (
              <CategoryCard
                key={c.code}
                icon={CATEGORY_ICONS[c.code] ?? DEFAULT_CATEGORY_ICON}
                title={c.name}
                description={c.description}
                selected={c.code === category.code}
                onSelect={() => handleSelectCategory(c.code)}
              />
            ))}
          </div>

          <section className="rubro-subcategories" aria-labelledby="rubro-subcategories-title">
            <h2 id="rubro-subcategories-title" className="rubro-subcategories-title">
              Subcategoría de {category.name}
            </h2>
            {category.subcategories.length > 0 ? (
              <div className="rubro-chips">
                {category.subcategories.map((s) => (
                  <Chip
                    key={s.code}
                    selected={s.code === subcategory?.code}
                    onClick={() => setRubro(category.code, s.code)}
                  >
                    {s.name}
                  </Chip>
                ))}
              </div>
            ) : (
              <p className="rubro-empty">Este rubro todavía no tiene subcategorías.</p>
            )}
          </section>
        </>
      )}

      <div className="flow-step-actions">
        <Button variant="text" to="/">
          Volver al inicio
        </Button>
        <Button
          variant="primary"
          disabled={!subcategory}
          onClick={() => navigate('/analizar/negocio')}
        >
          Siguiente
        </Button>
      </div>
    </div>
  )
}

export default Rubro
