import './Badge.css'

// variant: 'strength' | 'alert' | 'weakness' | 'neutral' | 'not_evaluated' | 'estimated'
// (los nombres coinciden con las lecturas que devuelve el reporte de la API)
function Badge({ variant = 'neutral', children }) {
  return <span className={`badge badge--${variant}`}>{children}</span>
}

export default Badge
