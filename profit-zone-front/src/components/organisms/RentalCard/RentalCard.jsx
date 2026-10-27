import { useEffect } from 'react'
import Icon from '../../atoms/Icon/Icon.jsx'
import Button from '../../atoms/Button/Button.jsx'
import { formatCurrency, formatNumber } from '../../../utils/formatters.js'
// Misma ficha flotante que la de los negocios: se ven iguales sobre el mapa
import '../PlaceCard/PlaceCard.css'

/**
 * Ficha de un aviso de alquiler, flotando sobre el mapa del análisis.
 * `listing`: { address, priceArs, surfaceM2, pricePerM2Ars, distanceText, url }.
 * Se cierra con la X o con Escape.
 */
function RentalCard({ listing, onClose }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const money = (value) => (value ? formatCurrency(value, 'ARS', { decimals: 0 }) : null)

  return (
    <aside className="place-card" aria-label={`Aviso en ${listing.address}`}>
      <button type="button" className="place-card-close" aria-label="Cerrar ficha" onClick={onClose}>
        <Icon name="x" size={16} />
      </button>

      <header className="place-card-header">
        <h3 className="place-card-name">{listing.address}</h3>
        <p className="place-card-kind">Local comercial en alquiler</p>
        {listing.distanceText && (
          <div className="place-card-badges">
            <span className="place-card-distance">A {listing.distanceText} de tu punto</span>
          </div>
        )}
      </header>

      <ul className="place-card-rows">
        {money(listing.priceArs) && (
          <li className="place-card-row">
            <Icon name="store" size={16} className="place-card-row-icon" />
            <div className="place-card-row-content">{money(listing.priceArs)} por mes</div>
          </li>
        )}
        {listing.surfaceM2 && (
          <li className="place-card-row">
            <Icon name="map" size={16} className="place-card-row-icon" />
            <div className="place-card-row-content">
              {formatNumber(listing.surfaceM2)} m²
              {money(listing.pricePerM2Ars) && ` · ${money(listing.pricePerM2Ars)} por m²`}
            </div>
          </li>
        )}
      </ul>

      {listing.url && (
        <Button variant="secondary" size="m" href={listing.url} target="_blank" rel="noopener noreferrer">
          <Icon name="external-link" size={16} />
          Ver el aviso en ZonaProp
        </Button>
      )}
      <p className="place-card-source">Aviso publicado en ZonaProp.</p>
    </aside>
  )
}

export default RentalCard
