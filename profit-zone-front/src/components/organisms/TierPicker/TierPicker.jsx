import { Link } from 'react-router-dom'
import Icon from '../../atoms/Icon/Icon.jsx'
import { SIGNUP_FREE_CREDITS, TIER_LIST, creditsFor, pluralCredits } from '../../../utils/plans.js'
import './TierPicker.css'

// Lo que dice cada opción sobre el saldo: con sesión, cuántos créditos de ese tipo tiene;
// sin sesión, cómo conseguirlos
function kindLabel(tier, count) {
  if (tier.creditKind === 'free') return 'gratis'
  return count === 1 ? 'pago' : 'pagos'
}

function balanceText(tier, user) {
  if (user) {
    const count = creditsFor(user, tier.code)
    return count > 0
      ? `Tenés ${pluralCredits(count)} ${kindLabel(tier, count)}`
      : `No tenés créditos ${kindLabel(tier, 0)}`
  }
  return tier.code === 'basic'
    ? `Te regalamos ${SIGNUP_FREE_CREDITS} al crear tu cuenta`
    : 'Se compran en packs desde USD 3'
}

/**
 * Elección del tipo de análisis en el paso de la zona: básico (1 crédito gratis) o completo
 * (1 crédito pago). Muestra qué incluye cada uno y cuántos créditos tiene el usuario.
 * - `value`: 'basic' | 'complete' — `onChange(tierCode)`.
 * - `user`: el usuario con sesión (con `credits`) o null.
 */
function TierPicker({ value, onChange, user }) {
  const selected = TIER_LIST.find((tier) => tier.code === value)
  const missing = user && creditsFor(user, value) === 0

  return (
    <fieldset className="tier-picker">
      <legend className="tier-picker-legend">Tipo de análisis</legend>

      <div className="tier-picker-options">
        {TIER_LIST.map((tier) => {
          const isSelected = tier.code === value
          return (
            <label key={tier.code} className={`tier-option${isSelected ? ' tier-option--selected' : ''}`}>
              <input
                type="radio"
                name="analysis-tier"
                className="tier-option-input"
                value={tier.code}
                checked={isSelected}
                onChange={() => onChange(tier.code)}
              />
              <span className="tier-option-head">
                <span className="tier-option-name">{tier.name}</span>
                <span className="tier-option-cost">
                  <Icon name="coins" size={13} />1 {tier.creditLabel}
                </span>
              </span>
              <span className="tier-option-summary">{tier.summary}</span>
              <span className="tier-option-balance">{balanceText(tier, user)}</span>
            </label>
          )
        })}
      </div>

      {missing && (
        <p className="tier-picker-missing" role="status">
          No te quedan créditos {kindLabel(selected, 0)} para este análisis.{' '}
          <Link to="/creditos" className="tier-picker-link">
            Comprar créditos
          </Link>
        </p>
      )}
    </fieldset>
  )
}

export default TierPicker
