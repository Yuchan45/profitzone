import IconTile from '../../atoms/IconTile/IconTile.jsx'
import Badge from '../../atoms/Badge/Badge.jsx'
import Button from '../../atoms/Button/Button.jsx'
import Icon from '../../atoms/Icon/Icon.jsx'
import './IndicatorCard.css'

/**
 * Tarjeta de un indicador del análisis: ícono, título, dato principal con su aclaración,
 * detalle (`children`), una lectura destacada (`callout`) y la fuente.
 * status: 'loading' | 'error' | 'empty' | 'ok'.
 * - error: muestra `error` y, con `onRetry`, el botón para reintentar.
 * - empty: el dato existe pero no hay nada que mostrar (`empty`: { title, text }).
 */
function IndicatorCard({
  icon,
  title,
  badge,
  status = 'ok',
  value,
  caption,
  callout,
  source,
  error,
  empty,
  onRetry,
  children,
}) {
  return (
    <section className="indicator-card" aria-busy={status === 'loading' || undefined}>
      <header className="indicator-card-header">
        <IconTile icon={icon} size="m" />
        <h2 className="indicator-card-title">{title}</h2>
        {badge && status === 'ok' && <Badge variant="alert">{badge}</Badge>}
      </header>

      {status === 'loading' && (
        <div className="indicator-card-skeleton" aria-label={`Cargando ${title.toLowerCase()}`}>
          <span className="indicator-card-skeleton-value" />
          <span className="indicator-card-skeleton-line" />
          <span className="indicator-card-skeleton-line indicator-card-skeleton-line--short" />
          <span className="indicator-card-skeleton-block" />
          <span className="indicator-card-source">Cargando…</span>
        </div>
      )}

      {status === 'error' && (
        <div className="indicator-card-message" role="alert">
          <p className="indicator-card-message-title">No pudimos cargar este dato.</p>
          {error && <p className="indicator-card-message-text">{error}</p>}
          {onRetry && (
            <Button variant="secondary" size="m" onClick={onRetry} className="indicator-card-retry">
              Reintentar
            </Button>
          )}
        </div>
      )}

      {status === 'empty' && (
        <div className="indicator-card-message">
          <p className="indicator-card-message-title">{empty.title}</p>
          {empty.text && <p className="indicator-card-message-text">{empty.text}</p>}
        </div>
      )}

      {status === 'ok' && (
        <>
          <p className="indicator-card-headline">
            <span className="indicator-card-value">{value}</span>
            {caption && <span className="indicator-card-caption">{caption}</span>}
          </p>
          {children}
          {callout && <p className="indicator-card-callout">{callout}</p>}
          {source && (
            <p className="indicator-card-source">
              <Icon name="info" size={12} />
              {source}
            </p>
          )}
        </>
      )}
    </section>
  )
}

export default IndicatorCard
