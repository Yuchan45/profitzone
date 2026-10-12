import logoFull from '../../../assets/logo/profitzone-logo.webp'
import logoNegative from '../../../assets/logo/profitzone-logo-negativo.webp'
import logoMark from '../../../assets/logo/profitzone-isotipo.webp'
import './Logo.css'

const SOURCES = {
  full: logoFull,
  negative: logoNegative,
  mark: logoMark,
}

/**
 * Logo de ProfitZone.
 * variant: 'full' (isotipo + nombre) | 'negative' (isotipo + nombre, para fondos oscuros)
 *   | 'mark' (solo el isotipo).
 * size: 's' | 'm' | 'l' (alto del logo).
 */
function Logo({ variant = 'full', size = 'm' }) {
  return (
    <img
      className={`logo logo--${variant} logo--${size}`}
      src={SOURCES[variant]}
      alt="ProfitZone"
    />
  )
}

export default Logo
