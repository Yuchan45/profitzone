import { useEffect, useRef } from 'react'
import { useMediaQuery } from '../../../hooks/useMediaQuery.js'
import LocationMap from '../LocationMap/LocationMap.jsx'
import Chip from '../../atoms/Chip/Chip.jsx'
import IconButton from '../../atoms/IconButton/IconButton.jsx'
import Icon from '../../atoms/Icon/Icon.jsx'
import './ZoneMapPanel.css'

/**
 * Mapa del análisis, siempre a mano mientras se lee el reporte.
 * - Escritorio: columna fija a la derecha. "Ocultar" la pliega a un riel angosto y
 *   "Ampliar" la pasa a pantalla completa (Esc o el botón para volver).
 * - Mobile: franja fija arriba; tocarla o "Ampliar" la abre como panel desde abajo. En la
 *   franja el mapa no se arrastra: deslizar el dedo tiene que mover la página.
 * Muestra una capa a la vez (`layers`: [{ id, label, places, legend, note }]); el padre
 * decide cuál con `layer` (sigue la sección que se está leyendo) y `onLayerChange`.
 * `selectedId` marca un punto y `onSelect(id)` avisa el click en uno.
 */
function ZoneMapPanel({
  location,
  neighborhood,
  loading = false,
  placeLabel,
  layers,
  layer,
  onLayerChange,
  selectedId = null,
  onSelect,
  collapsed,
  onCollapsedChange,
  expanded,
  onExpandedChange,
}) {
  const expandButtonRef = useRef(null)
  const shrinkButtonRef = useRef(null)
  const lastExpanded = useRef(expanded)
  const activeLayer = layers.find((candidate) => candidate.id === layer) ?? layers[0]
  // Mismo corte que ZoneMapPanel.css: debajo, el panel es una franja
  const isStrip = useMediaQuery('(max-width: 1023px)') && !expanded

  // Al ampliar, el foco va al botón para volver; al cerrar, vuelve al de ampliar.
  // Solo cuando cambia de verdad (no al cargar la página)
  useEffect(() => {
    if (lastExpanded.current === expanded) return
    lastExpanded.current = expanded
    if (expanded) shrinkButtonRef.current?.focus()
    else expandButtonRef.current?.focus()
  }, [expanded])

  // Esc cierra el mapa ampliado
  useEffect(() => {
    if (!expanded) return undefined
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onExpandedChange(false)
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [expanded, onExpandedChange])

  if (collapsed) {
    return (
      <aside className="zone-map-panel zone-map-panel--collapsed" aria-label="Mapa de la zona">
        <button type="button" className="zone-map-panel-reveal" onClick={() => onCollapsedChange(false)}>
          <Icon name="map" size={18} />
          <span>Mostrar mapa</span>
        </button>
      </aside>
    )
  }

  return (
    <>
      {expanded && (
        <div className="zone-map-panel-backdrop" aria-hidden="true" onClick={() => onExpandedChange(false)} />
      )}
      <aside
        className={`zone-map-panel${expanded ? ' zone-map-panel--expanded' : ''}`}
        aria-label="Mapa de la zona"
      >
        <div className="zone-map-panel-bar">
          {placeLabel && (
            <p className="zone-map-panel-place">
              <Icon name="map-pin" size={14} />
              <span>{placeLabel}</span>
            </p>
          )}
          <div className="zone-map-panel-actions">
            {expanded ? (
              <IconButton
                ref={shrinkButtonRef}
                icon="minimize-2"
                label="Reducir mapa"
                className="icon-button--tooltip-end"
                onClick={() => onExpandedChange(false)}
              />
            ) : (
              <IconButton
                ref={expandButtonRef}
                icon="maximize-2"
                label="Ampliar mapa"
                onClick={() => onExpandedChange(true)}
              />
            )}
            {!expanded && (
              <IconButton
                icon="panel-right-close"
                label="Ocultar mapa"
                className="icon-button--tooltip-end"
                onClick={() => onCollapsedChange(true)}
              />
            )}
          </div>
        </div>

        {layers.length > 1 && (
          <div className="zone-map-panel-layers" role="group" aria-label="Qué mostrar en el mapa">
            {layers.map((candidate) => (
              <Chip
                key={candidate.id}
                selected={candidate.id === activeLayer.id}
                onClick={() => onLayerChange(candidate.id)}
              >
                {candidate.label}
              </Chip>
            ))}
          </div>
        )}

        <div className="zone-map-panel-map">
          {location && !loading ? (
            <LocationMap
              center={neighborhood?.center ?? location}
              bounds={neighborhood?.bounds}
              boundary={neighborhood?.boundary}
              point={location}
              radius={location.radius}
              places={activeLayer.places}
              selectedPlaceId={selectedId}
              onPlaceSelect={onSelect}
              readOnly
              locked={isStrip}
            />
          ) : (
            <div className="flow-skeleton zone-map-panel-skeleton" aria-busy="true" aria-label="Cargando el mapa" />
          )}
          {/* En la franja, tocar el mapa lo amplía (para teclado está el botón "Ampliar mapa") */}
          {isStrip && location && !loading && (
            <button
              type="button"
              className="zone-map-panel-tap"
              tabIndex={-1}
              aria-hidden="true"
              onClick={() => onExpandedChange(true)}
            >
              <span className="zone-map-panel-tap-hint">
                <Icon name="maximize-2" size={14} />
                Tocá para ampliar
              </span>
            </button>
          )}
        </div>

        <div className="zone-map-panel-key">
          <ul className="zone-map-panel-legend" aria-label="Referencias del mapa">
            {activeLayer.legend.map((item) => (
              <li key={item.label} className={`zone-map-panel-legend-item zone-map-panel-legend-item--${item.tone}`}>
                {item.label}
              </li>
            ))}
          </ul>
          {activeLayer.note && <p className="zone-map-panel-note">{activeLayer.note}</p>}
        </div>
      </aside>
    </>
  )
}

export default ZoneMapPanel
