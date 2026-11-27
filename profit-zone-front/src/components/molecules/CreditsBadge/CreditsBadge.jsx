import { Link } from 'react-router-dom'
import Icon from '../../atoms/Icon/Icon.jsx'
import './CreditsBadge.css'

/**
 * Saldo de créditos del usuario en la barra: ícono y total, y lleva a "Mis créditos".
 * `credits`: { free, paid }. Con el título completo: "2 gratis · 5 pagos".
 */
function CreditsBadge({ credits }) {
  const total = credits.free + credits.paid
  const detail = `${credits.free} gratis · ${credits.paid} ${credits.paid === 1 ? 'pago' : 'pagos'}`

  return (
    <Link
      to="/creditos"
      className={`credits-badge${total === 0 ? ' credits-badge--empty' : ''}`}
      title={detail}
      aria-label={`Tenés ${total} ${total === 1 ? 'crédito' : 'créditos'} (${detail}). Ver mis créditos`}
    >
      <Icon name="coins" size={16} />
      <span className="credits-badge-count">{total}</span>
    </Link>
  )
}

export default CreditsBadge
