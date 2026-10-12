import { useEffect, useMemo, useRef } from 'react'
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
import { isPointInPolygons } from '../../../utils/geo.js'
import './LocationMap.css'

// Tiles estándar de OpenStreetMap, a color (gratis, sin clave; requieren atribución).
const TILES_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const TILES_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
const DEFAULT_ZOOM = 15
// Margen mínimo alrededor del barrio: el mapa no muestra más que Palermo
const BOUNDS_PADDING = 0.02

// Anillo que cubre todo el mundo: con el barrio como hueco, oscurece lo de afuera
const WORLD_RING = [
  [-90, -180],
  [-90, 180],
  [90, 180],
  [90, -180],
]

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

// No deja alejar el mapa más allá de lo necesario para ver el barrio entero
function FitMinZoom({ bounds }) {
  const map = useMap()
  useEffect(() => {
    if (bounds) map.setMinZoom(map.getBoundsZoom(bounds))
  }, [bounds, map])
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
 * Solo se aceptan puntos dentro del barrio: un click o un arrastre afuera no mueve
 * el punto y llama a `onOutsidePick`.
 * `focusKey` cambia cuando el punto viene del buscador, para centrar el mapa ahí.
 */
function LocationMap({
  center,
  bounds,
  boundary,
  point,
  radius,
  onPointChange,
  onOutsidePick,
  focusKey,
  outside = false,
}) {
  // Memo: FitMinZoom depende de este objeto
  const maxBounds = useMemo(
    () =>
      bounds
        ? L.latLngBounds([bounds.south, bounds.west], [bounds.north, bounds.east]).pad(BOUNDS_PADDING)
        : undefined,
    [bounds],
  )
  const isInside = (candidate) => !boundary || isPointInPolygons(candidate, boundary)

  const handlePick = (candidate) => {
    if (isInside(candidate)) onPointChange(candidate)
    else onOutsidePick?.()
  }
  return (
    <div className={`location-map${outside ? ' location-map--outside' : ''}`}>
      <MapContainer
        center={point ? [point.lat, point.lng] : [center.lat, center.lng]}
        zoom={DEFAULT_ZOOM}
        className="location-map-canvas"
        scrollWheelZoom
        zoomControl={false}
        maxBounds={maxBounds}
        maxBoundsViscosity={1}
      >
        <ZoomControl position="topright" />
        <TileLayer url={TILES_URL} attribution={TILES_ATTRIBUTION} maxZoom={19} />
        {boundary && (
          <>
            <Polygon
              positions={[WORLD_RING, ...boundary.map(([outer]) => outer)]}
              pathOptions={{ className: 'location-map-outside' }}
              interactive={false}
            />
            <Polygon positions={boundary} pathOptions={{ className: 'location-map-boundary' }} interactive={false} />
          </>
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
                  if (isInside({ lat, lng })) {
                    onPointChange({ lat, lng })
                  } else {
                    // Soltado fuera del barrio: el marcador vuelve a donde estaba
                    event.target.setLatLng([point.lat, point.lng])
                    onOutsidePick?.()
                  }
                },
              }}
            />
          </>
        )}
        <PickOnClick onPick={handlePick} />
        <FitMinZoom bounds={maxBounds} />
        <FollowPoint point={point} focusKey={focusKey} />
      </MapContainer>
      <p className="location-map-hint">Hacé click en el mapa o arrastrá el marcador</p>
    </div>
  )
}

export default LocationMap
