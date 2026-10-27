import Icon from '../Icon/Icon.jsx'
import './Badge.css'

// variant: 'strength' | 'alert' | 'weakness' | 'neutral' | 'not_evaluated'
// (los nombres coinciden con las lecturas que devuelve el reporte de la API;
// la clase CSS va en kebab-case). `icon` (opcional): ícono antes del texto, para que
// la lectura no dependa solo del color.
function Badge({ variant = 'neutral', icon, children }) {
  return (
    <span className={`badge badge--${variant.replaceAll('_', '-')}`}>
      {icon && <Icon name={icon} size={12} strokeWidth={2.5} />}
      {children}
    </span>
  )
}

export default Badge
