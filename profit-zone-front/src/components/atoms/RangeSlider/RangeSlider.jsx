import './RangeSlider.css'

// Slider nativo (input range) con el tramo elegido pintado en turquesa.
function RangeSlider({ min, max, step = 1, value, onChange, className = '', ...rest }) {
  const progress = ((value - min) / (max - min)) * 100
  return (
    <input
      type="range"
      className={`range-slider ${className}`.trim()}
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      style={{ '--range-progress': `${progress}%` }}
      {...rest}
    />
  )
}

export default RangeSlider
