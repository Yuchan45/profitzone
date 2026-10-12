import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Circle,
  CircleMarker,
  MapContainer,
  Marker,
  Polygon,
  TileLayer,
  Tooltip,
  ZoomControl,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { isPointInPolygons } from '../../../utils/geo.js'
import './LocationMap.css'

// Tiles "World Street Map" de Esri: a color y sin íconos de lugares (hospitales,
// iglesias, supermercados…), así solo se ven los competidores. Sin clave; requieren
// atribución. Los negocios del rubro son datos de OpenStreetMap: también se atribuye.
const TILES_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'
const TILES_ATTRIBUTION =
  'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, USGS | Negocios &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
// Desde este zoom los nombres de los competidores quedan fijos sobre el mapa;
// más lejos se ven al pasar el mouse (con cientos de puntos taparían todo)
const PLACE_NAMES_ZOOM = 17
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

// Avisa el zoom actual (para mostrar u ocultar los nombres de los competidores)
function WatchZoom({ onZoom }) {
  const map = useMapEvents({ zoomend: () => onZoom(map.getZoom()) })
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
 * `places` (opcional): negocios del rubro en el radio, como puntos; los de
 * competencia directa (`direct`) se destacan.
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
  places = [],
}) {
  // Memo: FitMinZoom depende de este objeto
  const maxBounds = useMemo(
    () =>
      bounds
        ? L.latLngBounds([bounds.south, bounds.west], [bounds.north, bounds.east]).pad(BOUNDS_PADDING)
        : undefined,
    [bounds],
  )
  const [zoom, setZoom] = useState(DEFAULT_ZOOM)
  const showPlaceNames = zoom >= PLACE_NAMES_ZOOM
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
            {places.map((place) => (
              <CircleMarker
                // La key cambia con showPlaceNames: Leaflet no actualiza "permanent" de un tooltip ya creado
                key={`${place.id}-${showPlaceNames}`}
                center={[place.lat, place.lng]}
                radius={place.direct ? 6 : 4}
                pathOptions={{
                  className: place.direct ? 'location-map-place location-map-place--direct' : 'location-map-place',
                }}
              >
                {place.name && (
                  <Tooltip
                    direction="top"
                    offset={[0, -4]}
                    permanent={showPlaceNames}
                    className={`location-map-place-label${place.direct ? ' location-map-place-label--direct' : ''}`}
                  >
                    {place.name}
                  </Tooltip>
                )}
              </CircleMarker>
            ))}
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
        <WatchZoom onZoom={setZoom} />
        <FollowPoint point={point} focusKey={focusKey} />
      </MapContainer>
      <p className="location-map-hint">Hacé click en el mapa o arrastrá el marcador</p>
    </div>
  )
}

export default LocationMap
