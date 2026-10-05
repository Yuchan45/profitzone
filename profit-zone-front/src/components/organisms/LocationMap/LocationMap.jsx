import { useEffect, useRef } from 'react'
import {
  Circle,
  MapContainer,
  Marker,
  Polygon,
  TileLayer,
  ZoomControl,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './LocationMap.css'

// Tiles estándar de OpenStreetMap (gratis, sin clave; requieren atribución). Se
// muestran en grises con CSS para acercarlos al mapa del Figma.
const TILES_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const TILES_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
const DEFAULT_ZOOM = 14

// Marcador con HTML y CSS propio: los íconos por defecto de Leaflet no cargan con Vite
const markerIcon = L.divIcon({
  className: 'location-map-marker',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
})

function PickOnClick({ onPick }) {
  useMapEvents({
    click: (event) => onPick({ lat: event.latlng.lat, lng: event.latlng.lng }),
  })
  return null
}

// Centra el mapa en el punto cuando viene de afuera (ej. el buscador de direcciones)
function FollowPoint({ point, focusKey }) {
  const map = useMap()
  const lastFocusKey = useRef(focusKey)
  useEffect(() => {
    // Solo cuando cambia focusKey: un click en el mapa no tiene que mover la vista
    if (focusKey === lastFocusKey.current) return
    lastFocusKey.current = focusKey
    if (point) map.flyTo([point.lat, point.lng], Math.max(map.getZoom(), 15))
  }, [focusKey, point, map])
  return null
}

/**
 * Mapa del paso 3: muestra el contorno del barrio, el punto elegido y el círculo
 * del radio. Un click o arrastrar el marcador cambia el punto (`onPointChange`).
 * `focusKey` cambia cuando el punto viene del buscador, para centrar el mapa ahí.
 */
function LocationMap({ center, boundary, point, radius, onPointChange, focusKey, outside = false }) {
  return (
    <div className={`location-map${outside ? ' location-map--outside' : ''}`}>
      <MapContainer
        center={point ? [point.lat, point.lng] : [center.lat, center.lng]}
        zoom={DEFAULT_ZOOM}
        className="location-map-canvas"
        scrollWheelZoom
        zoomControl={false}
      >
        <ZoomControl position="topright" />
        <TileLayer url={TILES_URL} attribution={TILES_ATTRIBUTION} maxZoom={19} />
        {boundary && (
          <Polygon positions={boundary} pathOptions={{ className: 'location-map-boundary' }} interactive={false} />
        )}
        {point && (
          <>
            <Circle
              center={[point.lat, point.lng]}
              radius={radius}
              pathOptions={{ className: 'location-map-radius' }}
              interactive={false}
            />
            <Marker
              position={[point.lat, point.lng]}
              icon={markerIcon}
              draggable
              keyboard={false}
              eventHandlers={{
                dragend: (event) => {
                  const { lat, lng } = event.target.getLatLng()
                  onPointChange({ lat, lng })
                },
              }}
            />
          </>
        )}
        <PickOnClick onPick={onPointChange} />
        <FollowPoint point={point} focusKey={focusKey} />
      </MapContainer>
      <p className="location-map-hint">Hacé click en el mapa o arrastrá el marcador</p>
    </div>
  )
}

export default LocationMap
