import './MapBackdrop.css'

// Ilustración decorativa de un mapa (estilo Google Maps): grilla de manzanas en
// diagonal, avenidas, un parque con lagos, el punto elegido con su radio y los
// competidores dentro del radio. Todo en SVG, sin tiles externos.

const BLOCK = 92
const STREET = 14
const STEP = BLOCK + STREET
const GRID = Array.from({ length: 18 }, (_, i) => -400 + i * STEP)

// Cada 4 calles hay una avenida
const AVENUES = GRID.filter((_, i) => i % 4 === 2).map((pos) => pos - STREET / 2)

// Punto elegido y radio de análisis (en la mitad de arriba: abajo va el texto)
const CENTER = { x: 500, y: 330 }
const RADIUS = 200

// Competidores: posición relativa al punto elegido (todos dentro del radio)
const COMPETITORS = [
  [88, -56],
  [-116, 36],
  [56, 124],
  [-60, -134],
  [142, 62],
  [-144, -68],
  [16, 166],
  [-30, 92],
]

// Pin tipo gota con la punta en (0, 0)
const PIN_PATH = 'M0 0C0 0 -11 -12.5 -11 -21a11 11 0 0 1 22 0C11 -12.5 0 0 0 0z'

function Pin({ x, y, scale, className }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} className={className}>
      <ellipse cx="0" cy="1" rx="6" ry="2" className="map-backdrop-pin-shadow" />
      <path d={PIN_PATH} />
      <circle cx="0" cy="-21" r="4.2" className="map-backdrop-pin-dot" />
    </g>
  )
}

function MapBackdrop() {
  return (
    <svg
      className="map-backdrop"
      viewBox="0 0 800 1000"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="800" height="1000" className="map-backdrop-land" />

      <g transform="rotate(-14 400 500)">
        {/* Manzanas */}
        {GRID.map((x) =>
          GRID.map((y) => (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width={BLOCK}
              height={BLOCK}
              rx="3"
              className="map-backdrop-block"
            />
          )),
        )}

        {/* Avenidas */}
        {AVENUES.map((pos) => (
          <g key={pos}>
            <line x1={pos} y1="-500" x2={pos} y2="1500" className="map-backdrop-avenue" />
            <line x1="-500" y1={pos} x2="1500" y2={pos} className="map-backdrop-avenue" />
          </g>
        ))}

        {/* Parque con lagos (sin etiqueta: cae debajo del texto del panel) */}
        <path
          d="M-180 700 L190 655 Q260 650 270 720 L300 1100 L-180 1180 Z"
          className="map-backdrop-park"
        />
        <ellipse cx="80" cy="830" rx="85" ry="42" className="map-backdrop-water" />
        <ellipse cx="190" cy="930" rx="45" ry="28" className="map-backdrop-water" />

        {/* Nombres de calles */}
        <text x="-120" y={AVENUES[1] + 4} className="map-backdrop-street-label">
          Av. Santa Fe
        </text>
        <text x="-120" y={AVENUES[2] + 4} className="map-backdrop-street-label">
          Av. Córdoba
        </text>
        <text
          x={AVENUES[2] + 4}
          y="560"
          transform={`rotate(90 ${AVENUES[2] + 4} 560)`}
          className="map-backdrop-street-label"
        >
          Gurruchaga
        </text>
      </g>

      {/* Radio de análisis */}
      <circle cx={CENTER.x} cy={CENTER.y} r={RADIUS} className="map-backdrop-radius" />

      {/* Competidores dentro del radio */}
      {COMPETITORS.map(([dx, dy]) => (
        <Pin
          key={`${dx}-${dy}`}
          x={CENTER.x + dx}
          y={CENTER.y + dy}
          scale={0.85}
          className="map-backdrop-pin map-backdrop-pin--competitor"
        />
      ))}

      {/* Punto elegido */}
      <circle cx={CENTER.x} cy={CENTER.y} r="10" className="map-backdrop-center-halo" />
      <Pin x={CENTER.x} y={CENTER.y} scale={1.8} className="map-backdrop-pin map-backdrop-pin--selected" />
    </svg>
  )
}

export default MapBackdrop
