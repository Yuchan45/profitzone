import { useId, useState } from 'react'
import IconTile from '../../atoms/IconTile/IconTile.jsx'
import Badge from '../../atoms/Badge/Badge.jsx'
import Button from '../../atoms/Button/Button.jsx'
import Icon from '../../atoms/Icon/Icon.jsx'
import './IndicatorCard.css'

/**
 * Tarjeta de un indicador del análisis: ícono, título, la lectura (`callout`) primero,
 * después el dato principal con su aclaración, el detalle (`children`) y la fuente.
 * El título es h3: las tarjetas van dentro de la sección "Los datos de la zona".
 * En mobile el detalle y la fuente arrancan plegados ("Ver detalle"): la tarjeta muestra
 * primero la lectura y el número, y la página no se hace interminable.
 * `titleAside` (opcional): algo junto al título, como un ⓘ con la explicación del dato.
 * status: 'loading' | 'error' | 'empty' | 'ok'.
 * - error: muestra `error` y, con `onRetry`, el botón para reintentar.
 * - empty: el dato existe pero no hay nada que mostrar (`empty`: { title, text }).
 */
function IndicatorCard({
  icon,
  title,
  titleAside,
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
  const detailId = useId()
  const [detailOpen, setDetailOpen] = useState(false)
  const hasDetail = Boolean(children || source)

  return (
    <section className="indicator-card" aria-busy={status === 'loading' || undefined}>
      <header className="indicator-card-header">
        <IconTile icon={icon} size="m" />
        <h3 className="indicator-card-title">
          {title}
          {titleAside}
        </h3>
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
          {/* Primero qué significa el dato; después el dato y su detalle */}
          {callout && <p className="indicator-card-callout">{callout}</p>}
          <p className="indicator-card-headline">
            <span className="indicator-card-value">{value}</span>
            {caption && <span className="indicator-card-caption">{caption}</span>}
          </p>
          {hasDetail && (
            <>
              {/* Solo se ve en mobile (en escritorio el detalle siempre está abierto) */}
              <button
                type="button"
                className="indicator-card-toggle"
                aria-expanded={detailOpen}
                aria-controls={detailId}
                onClick={() => setDetailOpen((open) => !open)}
              >
                {detailOpen ? 'Ocultar detalle' : 'Ver detalle'}
                <Icon name={detailOpen ? 'chevron-up' : 'chevron-down'} size={14} />
              </button>
              <div
                id={detailId}
                className={`indicator-card-detail${detailOpen ? ' indicator-card-detail--open' : ''}`}
              >
                {children}
                {source && (
                  <p className="indicator-card-source">
                    <Icon name="info" size={12} />
                    {source}
                  </p>
                )}
              </div>
            </>
          )}
        </>
      )}
    </section>
  )
}

export default IndicatorCard
