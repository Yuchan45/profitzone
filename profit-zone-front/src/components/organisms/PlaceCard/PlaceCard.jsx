import { useEffect } from 'react'
import Icon from '../../atoms/Icon/Icon.jsx'
import Badge from '../../atoms/Badge/Badge.jsx'
import Button from '../../atoms/Button/Button.jsx'
import {
  cuisineLabels,
  displayUrl,
  formatOpeningHours,
  googleMapsUrl,
  instagramUrl,
  placeAddress,
  placeAmenities,
  placeKindLabel,
  toExternalUrl,
} from '../../../utils/placeDisplay.js'
import { formatDistance } from '../../../utils/geo.js'
import './PlaceCard.css'

function ExternalLink({ href, children }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="place-card-link">
      {children}
    </a>
  )
}

function Row({ icon, children }) {
  return (
    <li className="place-card-row">
      <Icon name={icon} size={16} className="place-card-row-icon" />
      <div className="place-card-row-content">{children}</div>
    </li>
  )
}

/**
 * Ficha de un competidor, flotando sobre el mapa (paso 3). Muestra solo los datos
 * que el local tenga en OpenStreetMap y un link para verlo completo en Google Maps.
 * status: 'loading' | 'ok' | 'error'. `distance`: metros hasta el punto elegido.
 * Se cierra con la X o con Escape.
 */
function PlaceCard({ status, place, error, direct = false, distance = null, onClose }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const details = place?.details ?? {}
  const address = place ? placeAddress(details) : null
  const website = toExternalUrl(details.website)
  const instagram = instagramUrl(details.instagram)
  const facebook = toExternalUrl(details.facebook)
  const amenities = placeAmenities(details)
  const cuisines = place ? cuisineLabels(place.cuisines) : []

  return (
    <aside className="place-card" aria-label={place?.name ?? 'Ficha del negocio'}>
      <button type="button" className="place-card-close" aria-label="Cerrar ficha" onClick={onClose}>
        <Icon name="x" size={16} />
      </button>

      {status === 'loading' && <p className="place-card-message">Cargando el negocio…</p>}
      {status === 'error' && <p className="place-card-message">No pudimos cargar el negocio: {error}</p>}

      {status === 'ok' && place && (
        <>
          <header className="place-card-header">
            <h3 className="place-card-name">{place.name ?? 'Sin nombre'}</h3>
            <p className="place-card-kind">
              {/* Sin repetir: un café con cocina "coffee_shop" diría "Café · Café" */}
              {[...new Set([placeKindLabel(place.kind), ...cuisines])].join(' · ')}
            </p>
            <div className="place-card-badges">
              {direct && <Badge variant="alert">Competencia directa</Badge>}
              {distance !== null && (
                <span className="place-card-distance">A {formatDistance(Math.round(distance / 10) * 10)} de tu punto</span>
              )}
            </div>
          </header>

          <ul className="place-card-rows">
            {address && <Row icon="map-pin">{address}</Row>}
            {details.openingHours && (
              <Row icon="clock">
                {formatOpeningHours(details.openingHours).map((line) => (
                  <span key={line} className="place-card-line">
                    {line}
                  </span>
                ))}
              </Row>
            )}
            {details.phone && (
              <Row icon="phone">
                <a href={`tel:${details.phone.replace(/[^\d+]/g, '')}`} className="place-card-link">
                  {details.phone}
                </a>
              </Row>
            )}
            {website && (
              <Row icon="globe">
                <ExternalLink href={website}>{displayUrl(website)}</ExternalLink>
              </Row>
            )}
            {(instagram || facebook) && (
              <Row icon="link">
                {instagram && <ExternalLink href={instagram}>Instagram</ExternalLink>}
                {facebook && <ExternalLink href={facebook}>Facebook</ExternalLink>}
              </Row>
            )}
          </ul>

          {amenities.length > 0 && (
            <ul className="place-card-amenities" aria-label="Servicios">
              {amenities.map((amenity) => (
                <li key={amenity} className="place-card-amenity">
                  {amenity}
                </li>
              ))}
            </ul>
          )}

          {!address && !details.openingHours && !details.phone && !website && amenities.length === 0 && (
            <p className="place-card-message">OpenStreetMap no tiene más datos de este local.</p>
          )}

          <Button variant="secondary" size="m" href={googleMapsUrl(place)} target="_blank" rel="noopener noreferrer">
            <Icon name="external-link" size={16} />
            Ver en Google Maps
          </Button>
          <p className="place-card-source">Fotos y reseñas en Google Maps. Datos de la ficha: OpenStreetMap.</p>
        </>
      )}
    </aside>
  )
}

export default PlaceCard
