import { Link } from 'react-router-dom'
import Icon from '../../atoms/Icon/Icon.jsx'
import './InfoPage.css'

/**
 * Página de texto corto (sobre nosotros, contacto, privacidad): volver, título, bajada
 * opcional y secciones con título (`<InfoPage.Section>` como `children`).
 * `updated`: fecha de última actualización, para las páginas legales.
 */
function InfoPage({ title, lede, updated, children }) {
  return (
    <div className="info-page">
      <header className="info-page-header">
        <Link to="/" className="info-page-back">
          <Icon name="arrow-left" size={16} />
          Volver al inicio
        </Link>
        <h1 className="info-page-title">{title}</h1>
        {lede && <p className="info-page-lede">{lede}</p>}
        {updated && <p className="info-page-updated">{updated}</p>}
      </header>
      <div className="info-page-sections">{children}</div>
    </div>
  )
}

function InfoPageSection({ title, children }) {
  return (
    <section className="info-page-section">
      <h2 className="info-page-section-title">{title}</h2>
      {children}
    </section>
  )
}

InfoPage.Section = InfoPageSection

export default InfoPage
