import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCategories } from '../../hooks/useCategories.js'
import { useAnalysis } from '../../hooks/useAnalysis.js'
import Stepper from '../../components/organisms/Stepper/Stepper.jsx'
import CategoryCard from '../../components/molecules/CategoryCard/CategoryCard.jsx'
import Chip from '../../components/atoms/Chip/Chip.jsx'
import Button from '../../components/atoms/Button/Button.jsx'
import { ANALYSIS_PATHS, ANALYSIS_STEPS } from '../../utils/analysisSteps.js'
import './Rubro.css'

// La API no trae íconos: se asignan por code de categoría.
const CATEGORY_ICONS = {
  gastronomia: 'store',
  fitness: 'dumbbell',
}
const DEFAULT_CATEGORY_ICON = 'store'

function Rubro() {
  const navigate = useNavigate()
  const { status, data: categories, error } = useCategories()
  const { analysis, setRubro } = useAnalysis()
  // Si el usuario vuelve a este paso, arranca con lo que ya había elegido
  const [selectedCategoryCode, setSelectedCategoryCode] = useState(analysis.category?.code ?? null)
  const [selectedSubcategoryCode, setSelectedSubcategoryCode] = useState(
    analysis.subcategory?.code ?? null,
  )

  // Hasta que el usuario elija, queda seleccionada la primera categoría
  const category =
    categories?.find((c) => c.code === selectedCategoryCode) ?? categories?.[0] ?? null
  // Puede quedar una subcategoría guardada que ya no esté activa: en ese caso no cuenta
  const subcategory =
    category?.subcategories.find((s) => s.code === selectedSubcategoryCode) ?? null

  const handleSelectCategory = (code) => {
    if (code === category?.code) return
    setSelectedCategoryCode(code)
    setSelectedSubcategoryCode(null)
  }

  const handleNext = () => {
    setRubro(
      { code: category.code, name: category.name },
      { code: subcategory.code, name: subcategory.name },
    )
    navigate(ANALYSIS_PATHS.negocio)
  }

  return (
    <div className="rubro">
      <Stepper steps={ANALYSIS_STEPS} current={1} />

      <header className="rubro-heading">
        <h1 className="rubro-title">¿Qué querés abrir?</h1>
        <p className="rubro-subtitle">
          Elegí el rubro y la subcategoría. Con eso definimos qué locales cuentan como
          competencia en la zona.
        </p>
      </header>

      {status === 'loading' && (
        <div className="rubro-categories" aria-busy="true" aria-label="Cargando rubros">
          <div className="rubro-skeleton" />
          <div className="rubro-skeleton" />
        </div>
      )}

      {status === 'error' && (
        <p className="rubro-message rubro-message--error" role="alert">
          No pudimos cargar los rubros: {error}
        </p>
      )}

      {status === 'ok' && categories.length === 0 && (
        <p className="rubro-message">Todavía no hay rubros disponibles.</p>
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
                    onClick={() => setSelectedSubcategoryCode(s.code)}
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

      <div className="rubro-actions">
        <Button variant="text" to="/">
          Volver al inicio
        </Button>
        <Button variant="primary" disabled={!subcategory} onClick={handleNext}>
          Siguiente
        </Button>
      </div>
    </div>
  )
}

export default Rubro
