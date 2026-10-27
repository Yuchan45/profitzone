import './Benchmark.css'

/**
 * Cómo se ubica un dato del punto frente al resto de Palermo.
 * - `summary`: la lectura en una frase ("Más locales del rubro que el 97% de Palermo").
 * - `percentile` (0–100, opcional): dibuja la escala con la marca del punto y la mediana
 *   al medio. Sin percentil (ej. densidad, que se compara con el promedio) no hay escala.
 * - `detail`: los números de referencia ("Mediana de Palermo: 43 en 500 m").
 */
function Benchmark({ summary, percentile = null, detail }) {
  const hasScale = typeof percentile === 'number'
  return (
    <div className="benchmark">
      <p className="benchmark-label">Comparado con Palermo</p>
      <p className="benchmark-summary">{summary}</p>
      {hasScale && (
        <div className="benchmark-scale" aria-hidden="true">
          <span className="benchmark-track">
            <span className="benchmark-median" />
            <span className="benchmark-marker" style={{ '--benchmark-position': `${percentile}%` }} />
          </span>
          <span className="benchmark-ends">
            <span>Menos</span>
            <span>Mediana</span>
            <span>Más</span>
          </span>
        </div>
      )}
      {detail && <p className="benchmark-detail">{detail}</p>}
    </div>
  )
}

export default Benchmark
