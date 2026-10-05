import { useState } from 'react'
import { useCategories } from '../../hooks/useCategories.js'
import Stepper from '../../components/organisms/Stepper/Stepper.jsx'
import CategoryCard from '../../components/molecules/CategoryCard/CategoryCard.jsx'
import Chip from '../../components/atoms/Chip/Chip.jsx'
import Button from '../../components/atoms/Button/Button.jsx'
import './Rubro.css'

const PASOS = ['Rubro', 'Tu negocio', 'Ubicación', 'Análisis', 'Reporte']

// La API no trae íconos: se asignan por code de categoría.
const CATEGORY_ICONS = {
  gastronomia: 'store',
  fitness: 'dumbbell',
}
const DEFAULT_CATEGORY_ICON = 'store'

function Rubro() {
  const { status, data: categories, error } = useCategories()
  const [selectedCategoryCode, setSelectedCategoryCode] = useState(null)
  const [selectedSubcategoryCode, setSelectedSubcategoryCode] = useState(null)

  // Hasta que el usuario elija, queda seleccionada la primera categoría
  const category =
    categories?.find((c) => c.code === selectedCategoryCode) ?? categories?.[0] ?? null

  const handleSelectCategory = (code) => {
    if (code === category?.code) return
    setSelectedCategoryCode(code)
    setSelectedSubcategoryCode(null)
  }

  return (
    <div className="rubro">
      <Stepper steps={PASOS} current={1} />

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
                    selected={s.code === selectedSubcategoryCode}
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
        <Button variant="primary" disabled={!selectedSubcategoryCode}>
          Siguiente
        </Button>
      </div>
    </div>
  )
}

export default Rubro
