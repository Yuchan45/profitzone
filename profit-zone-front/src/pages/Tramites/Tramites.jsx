import { Link, useSearchParams } from 'react-router-dom'
import Icon from '../../components/atoms/Icon/Icon.jsx'
import Chip from '../../components/atoms/Chip/Chip.jsx'
import Button from '../../components/atoms/Button/Button.jsx'
import PermitsGuide from '../../components/organisms/PermitsGuide/PermitsGuide.jsx'
import { PERMITS_RUBROS } from '../../utils/permitsGuide.js'
import { NEW_ANALYSIS_LINK } from '../../utils/flowSteps.js'
import './Tramites.css'

const DEFAULT_RUBRO = PERMITS_RUBROS[0]

// El rubro elegido va en la URL (?rubro=cafeteria) para poder compartir el link
function findRubro(subcategoryCode) {
  for (const category of PERMITS_RUBROS) {
    const subcategory = category.subcategories.find((sub) => sub.code === subcategoryCode)
    if (subcategory) return { category, subcategory }
  }
  return { category: DEFAULT_RUBRO, subcategory: DEFAULT_RUBRO.subcategories[0] }
}

function Tramites() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { category, subcategory } = findRubro(searchParams.get('rubro'))

  const selectRubro = (code) => setSearchParams({ rubro: code }, { replace: true })

  return (
    <div className="tramites">
      <header className="tramites-header">
        <Link to="/" className="tramites-back-link">
          <Icon name="arrow-left" size={16} />
          Volver al inicio
        </Link>
        <h1 className="tramites-title">Trámites y habilitaciones por rubro</h1>
        <p className="tramites-intro">
          Si estás pensando en abrir tu negocio, esto es lo que vas a tener que gestionar en la Ciudad de Buenos
          Aires: inscripciones, habilitación del local y los requisitos propios de tu rubro.
        </p>
      </header>

      <nav className="tramites-rubros" aria-label="Elegí el rubro">
        {PERMITS_RUBROS.map((rubro) => (
          <div key={rubro.code} className="tramites-rubro-group">
            <span className="tramites-rubro-label">{rubro.name}</span>
            <div className="tramites-rubro-chips">
              {rubro.subcategories.map((sub) => (
                <Chip key={sub.code} selected={sub.code === subcategory.code} onClick={() => selectRubro(sub.code)}>
                  {sub.name}
                </Chip>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <PermitsGuide categoryCode={category.code} subcategoryCode={subcategory.code} title={subcategory.name} />

      <aside className="tramites-cta">
        <div>
          <h2 className="tramites-cta-title">¿Ya tenés una zona en mente?</h2>
          <p className="tramites-cta-text">
            Analizá la competencia, el movimiento y el alquiler antes de firmar.
          </p>
        </div>
        <Button {...NEW_ANALYSIS_LINK}>Analizar una zona</Button>
      </aside>
    </div>
  )
}

export default Tramites
