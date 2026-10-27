import { useEffect } from 'react'
import Icon from '../../atoms/Icon/Icon.jsx'
import Button from '../../atoms/Button/Button.jsx'
// Misma ficha flotante que la de los negocios: se ven iguales sobre el mapa
import '../PlaceCard/PlaceCard.css'

const KIND_LABELS = {
  bus: 'Parada de colectivo',
  subway: 'Estación de subte',
  train: 'Estación de tren',
}

/**
 * Ficha de una parada o estación, flotando sobre el mapa del análisis (capa "Transporte").
 * `stop`: { cleanName, category, lines, distanceText, location } (datos de OpenStreetMap).
 * Se cierra con la X o con Escape.
 */
function TransitCard({ stop, onClose }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Por coordenadas: los nombres de las paradas ("Honduras y Thames") no siempre se encuentran
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${stop.location.lat},${stop.location.lng}`

  return (
    <aside className="place-card" aria-label={stop.cleanName}>
      <button type="button" className="place-card-close" aria-label="Cerrar ficha" onClick={onClose}>
        <Icon name="x" size={16} />
      </button>

      <header className="place-card-header">
        <h3 className="place-card-name">{stop.cleanName}</h3>
        <p className="place-card-kind">{KIND_LABELS[stop.category] ?? 'Transporte'}</p>
        <div className="place-card-badges">
          <span className="place-card-distance">A {stop.distanceText} de tu punto</span>
        </div>
      </header>

      <ul className="place-card-rows">
        <li className="place-card-row">
          <Icon name="bus" size={16} className="place-card-row-icon" />
          <div className="place-card-row-content">{stop.lines ?? 'OpenStreetMap no tiene sus líneas cargadas'}</div>
        </li>
      </ul>

      <Button variant="secondary" size="m" href={mapsUrl} target="_blank" rel="noopener noreferrer">
        <Icon name="external-link" size={16} />
        Ver en Google Maps
      </Button>
      <p className="place-card-source">Datos de OpenStreetMap.</p>
    </aside>
  )
}

export default TransitCard
