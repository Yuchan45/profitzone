import './RangeSlider.css'

const percentOf = (value, min, max) => ((value - min) / (max - min)) * 100

/**
 * Slider nativo (input range) con el tramo elegido pintado en turquesa.
 * `limit` (opcional): valor máximo permitido; el tramo de `limit` a `max` se pinta
 * bloqueado y el valor no lo pasa. `onChange(value, blocked)` avisa con `blocked`
 * si el usuario intentó ir más allá del límite.
 */
function RangeSlider({ min, max, step = 1, value, onChange, limit, className = '', ...rest }) {
  const maxAllowed = limit ?? max
  const handleChange = (event) => {
    const raw = Number(event.target.value)
    onChange(Math.min(raw, maxAllowed), raw > maxAllowed)
  }

  return (
    <input
      type="range"
      className={`range-slider ${className}`.trim()}
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={handleChange}
      style={{
        '--range-progress': `${percentOf(value, min, max)}%`,
        '--range-limit': `${percentOf(maxAllowed, min, max)}%`,
      }}
      {...rest}
    />
  )
}

export default RangeSlider
