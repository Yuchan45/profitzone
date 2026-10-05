import './SegmentedProgress.css'

/**
 * Barra de progreso en segmentos (ej. partes de un paso).
 * `current` empieza en 1: los segmentos hasta `current` quedan marcados.
 * Es decorativa: quien la usa tiene que mostrar el progreso también en texto.
 */
function SegmentedProgress({ current, total }) {
  return (
    <span className="segmented-progress" aria-hidden="true">
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={`segmented-progress-segment${index < current ? ' segmented-progress-segment--filled' : ''}`}
        />
      ))}
    </span>
  )
}

export default SegmentedProgress
