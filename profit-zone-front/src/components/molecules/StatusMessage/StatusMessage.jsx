import './StatusMessage.css'

// variant: 'info' | 'error'. El error se anuncia a lectores de pantalla con role="alert".
function StatusMessage({ variant = 'info', children }) {
  return (
    <p
      className={`status-message status-message--${variant}`}
      role={variant === 'error' ? 'alert' : undefined}
    >
      {children}
    </p>
  )
}

export default StatusMessage
