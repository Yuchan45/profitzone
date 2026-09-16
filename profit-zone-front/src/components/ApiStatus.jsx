import { useHealth } from '../hooks/useHealth.js'

const LABELS = {
  loading: 'Conectando con la API...',
  ok: 'API conectada',
  error: 'Sin conexión con la API',
}

function ApiStatus() {
  const { status, data, error } = useHealth()

  return (
    <div className={`api-status api-status--${status}`}>
      <span className="api-status-dot" />
      <span>
        {LABELS[status]}
        {status === 'ok' && data ? ` (${data.service} · ${data.environment})` : ''}
        {status === 'error' ? `: ${error}` : ''}
      </span>
    </div>
  )
}

export default ApiStatus
