import './Badge.css'

// variant: 'strength' | 'alert' | 'weakness' | 'neutral' | 'not_evaluated'
// (los nombres coinciden con las lecturas que devuelve el reporte de la API;
// la clase CSS va en kebab-case)
function Badge({ variant = 'neutral', children }) {
  return <span className={`badge badge--${variant.replaceAll('_', '-')}`}>{children}</span>
}

export default Badge
