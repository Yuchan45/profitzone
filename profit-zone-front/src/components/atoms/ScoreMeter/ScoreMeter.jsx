import './ScoreMeter.css'

/**
 * Medidor de un puntaje sobre una escala (ej. afluencia 81 de 100): una barra con la
 * marca del valor y referencias de bajo / medio / alto, para que el número tenga contexto.
 * Es un `meter` nativo con su nombre accesible (`label`).
 */
function ScoreMeter({ value, max = 100, label }) {
  const percent = Math.max(0, Math.min(100, (value / max) * 100))

  return (
    <div className="score-meter">
      <meter className="score-meter-native" min={0} max={max} low={max / 3} high={(2 * max) / 3} value={value} aria-label={label}>
        {value} de {max}
      </meter>
      <div className="score-meter-track" aria-hidden="true">
        <span className="score-meter-fill" style={{ width: `${percent}%` }} />
      </div>
      <div className="score-meter-scale" aria-hidden="true">
        <span>Baja</span>
        <span>Media</span>
        <span>Alta</span>
      </div>
    </div>
  )
}

export default ScoreMeter
