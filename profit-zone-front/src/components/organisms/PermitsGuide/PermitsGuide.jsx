import { Link } from 'react-router-dom'
import Icon from '../../atoms/Icon/Icon.jsx'
import { getPermitsGuide, PERMITS_REVIEWED_AT } from '../../../utils/permitsGuide.js'
import './PermitsGuide.css'

function PermitItem({ item }) {
  return (
    <li className="permits-guide-item">
      <span className="permits-guide-item-icon" aria-hidden="true">
        <Icon name="check" size={14} strokeWidth={3} />
      </span>
      <div className="permits-guide-item-body">
        <h3 className="permits-guide-item-title">{item.title}</h3>
        <p className="permits-guide-item-text">{item.text}</p>
        <p className="permits-guide-item-meta">
          <span>{item.issuer ? `Lo gestionás en: ${item.issuer}` : `Lo exige: ${item.rule}`}</span>
          {item.url && (
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="permits-guide-item-link">
              Ver en el sitio oficial
              <Icon name="external-link" size={13} />
              <span className="permits-guide-sr-only"> (se abre en otra pestaña)</span>
            </a>
          )}
        </p>
      </div>
    </li>
  )
}

/**
 * Guía de trámites y habilitaciones para abrir el rubro elegido en la Ciudad.
 * Contenido estático de utils/permitsGuide.js: lo común a cualquier local, lo del
 * rubro y la subcategoría, y notas según cómo se atiende al público.
 * `serviceMode`: código de la respuesta a "¿Cómo vas a atender al público?" (opcional).
 * `showPageLink`: suma el link a la guía completa (/tramites).
 * `title`: en /tramites la página ya se titula "Trámites…", así que va el nombre del rubro.
 */
function PermitsGuide({
  categoryCode,
  subcategoryCode,
  serviceMode = null,
  showPageLink = false,
  title = 'Trámites y habilitaciones',
}) {
  const guide = getPermitsGuide({ categoryCode, subcategoryCode, serviceMode })
  if (!guide) return null

  return (
    <section className="permits-guide" aria-labelledby="permits-guide-title">
      <header className="permits-guide-header">
        <h2 id="permits-guide-title" className="permits-guide-title">
          {title}
        </h2>
        <p className="permits-guide-subtitle">
          Lo que vas a necesitar para abrir {guide.article} {guide.name.toLocaleLowerCase('es-AR')} en la Ciudad de
          Buenos Aires.
        </p>
      </header>

      <p className="permits-guide-tip">
        <Icon name="map-pin" size={18} />
        <span>
          <strong>Antes de firmar el alquiler,</strong> confirmá que tu actividad esté permitida en esa dirección. Si
          el uso no está admitido, no vas a poder habilitar el local.
        </span>
      </p>

      <div className="permits-guide-sections">
        {guide.sections.map((section) => (
          <details key={section.id} className="permits-guide-section" open={section.open}>
            <summary className="permits-guide-section-summary">
              <span className="permits-guide-section-title">{section.title}</span>
              <span className="permits-guide-section-count">
                {section.items.length === 1 ? '1 punto' : `${section.items.length} puntos`}
              </span>
              <Icon name="chevron-down" size={18} className="permits-guide-section-chevron" />
            </summary>
            {section.intro && <p className="permits-guide-section-intro">{section.intro}</p>}
            <ul className="permits-guide-items">
              {section.items.map((item) => (
                <PermitItem key={item.id} item={item} />
              ))}
            </ul>
          </details>
        ))}
      </div>

      <p className="permits-guide-note">
        <Icon name="info" size={16} />
        <span>
          Información orientativa, revisada en {PERMITS_REVIEWED_AT}. Los requisitos cambian y algunos dependen del
          tamaño del local: confirmalos en el sitio oficial o con un gestor o profesional matriculado.
          {showPageLink && (
            <>
              {' '}
              <Link to="/tramites" className="permits-guide-page-link">
                Ver la guía de todos los rubros
              </Link>
            </>
          )}
        </span>
      </p>
    </section>
  )
}

export default PermitsGuide
