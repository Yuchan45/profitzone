import { Link } from 'react-router-dom'
import Icon from '../../atoms/Icon/Icon.jsx'
import './DisclaimerCard.css'

const DEFAULT_TITLE = 'Descargo de responsabilidad comercial y legal'
const DEFAULT_TEXT =
  'Los datos, indicadores y análisis presentados por ProfitZone tienen fines exclusivamente informativos y de orientación analítica. La plataforma no asegura ni garantiza el éxito comercial, afluencia de clientes ni rentabilidad económica derivada de la apertura o inversión en una ubicación. La viabilidad del negocio depende de variables operativas, comerciales, financieras y de mercado ajenas a este sistema, siendo la decisión final de exclusiva responsabilidad del usuario.'

const COMPACT_TEXT =
  'Los indicadores son estimaciones estadísticas orientativas y no garantizan el éxito comercial ni la rentabilidad de la apertura.'

/**
 * Tarjeta o aviso de descargo de responsabilidad (Disclaimer legal).
 * compact: boolean - Versión reducida en una sola línea/banner (ideal para vistas previas como Análisis).
 * showLink: boolean - Muestra el enlace a los Términos y Condiciones completos.
 * showIcon: boolean - Muestra el ícono de escudo de advertencia junto al título o texto.
 */
function DisclaimerCard({
  title = DEFAULT_TITLE,
  text,
  compact = false,
  showLink = true,
  showIcon = true,
  className = '',
}) {
  if (compact) {
    return (
      <aside className={`disclaimer-card disclaimer-card--compact ${className}`.trim()} aria-label="Aviso legal">
        {showIcon && (
          <span className="disclaimer-card__icon" aria-hidden="true">
            <Icon name="shield-alert" size={16} />
          </span>
        )}
        <div className="disclaimer-card__compact-body">
          <p className="disclaimer-card__text">
            <strong>Aviso:</strong> {text || COMPACT_TEXT}{' '}
            {showLink && (
              <Link to="/terminos" className="disclaimer-card__link">
                Ver términos legales
              </Link>
            )}
          </p>
        </div>
      </aside>
    )
  }

  return (
    <aside
      className={`disclaimer-card ${className}`.trim()}
      aria-labelledby="disclaimer-card-title"
    >
      <header className="disclaimer-card__header">
        {showIcon && (
          <span className="disclaimer-card__icon" aria-hidden="true">
            <Icon name="shield-alert" size={22} />
          </span>
        )}
        <h2 id="disclaimer-card-title" className="disclaimer-card__title">
          {title}
        </h2>
      </header>
      <div className="disclaimer-card__body">
        <p className="disclaimer-card__text">{text || DEFAULT_TEXT}</p>
        {showLink && (
          <Link to="/terminos" className="disclaimer-card__link">
            Consultar Términos y Condiciones completos
          </Link>
        )}
      </div>
    </aside>
  )
}

export default DisclaimerCard

