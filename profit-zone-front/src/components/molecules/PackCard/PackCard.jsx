import Badge from '../../atoms/Badge/Badge.jsx'
import Button from '../../atoms/Button/Button.jsx'
import { formatCurrency } from '../../../utils/formatters.js'
import { pluralCredits } from '../../../utils/plans.js'
import './PackCard.css'

/**
 * Pack de créditos con su precio en dólares, en pesos y por crédito.
 * - `pack`: { code, credits, priceUsd, priceArs, pricePerCreditUsd, savingPercent } (GET /api/billing/packs).
 * - `featured`: resalta el pack (ej. el de mejor precio por crédito).
 * - `onBuy` (con sesión: inicia la compra) o `buyTo` (link, ej. a registrarse): el botón de compra.
 * - `buying`: la compra de este pack está en curso.
 */
function PackCard({ pack, featured = false, onBuy, buyTo, buying = false, disabled = false }) {
  const label = pluralCredits(pack.credits)

  return (
    <article className={`pack-card${featured ? ' pack-card--featured' : ''}`}>
      <header className="pack-card-header">
        <h3 className="pack-card-title">{label}</h3>
        {pack.savingPercent > 0 && <Badge variant="strength">{pack.savingPercent}% menos por crédito</Badge>}
      </header>

      <p className="pack-card-price">
        <span className="pack-card-usd">{formatCurrency(pack.priceUsd, 'USD', { decimals: 0 })}</span>
        <span className="pack-card-ars">≈ {formatCurrency(pack.priceArs, 'ARS', { decimals: 0 })}</span>
      </p>
      <p className="pack-card-unit">{formatCurrency(pack.pricePerCreditUsd, 'USD', { decimals: 2 })} por crédito</p>

      <p className="pack-card-note">Cada crédito es un análisis completo. No vencen.</p>

      {(onBuy || buyTo) && (
        <Button
          variant={featured ? 'primary' : 'secondary'}
          size="m"
          className="pack-card-cta"
          {...(buyTo ? { to: buyTo } : { onClick: onBuy, disabled: disabled || buying })}
        >
          {buying ? 'Redirigiendo…' : 'Comprar'}
        </Button>
      )}
    </article>
  )
}

export default PackCard
