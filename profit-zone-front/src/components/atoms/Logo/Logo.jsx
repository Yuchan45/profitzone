import logoFull from '../../../assets/logo/profitzone-logo.png'
import logoMark from '../../../assets/logo/profitzone-mark.png'
import './Logo.css'

/**
 * Logo de ProfitZone.
 * variant: 'full' (isotipo + nombre) | 'mark' (solo el isotipo).
 * size: 's' | 'm' | 'l' (alto del logo).
 */
function Logo({ variant = 'full', size = 'm' }) {
  return (
    <img
      className={`logo logo--${variant} logo--${size}`}
      src={variant === 'mark' ? logoMark : logoFull}
      alt="ProfitZone"
    />
  )
}

export default Logo
