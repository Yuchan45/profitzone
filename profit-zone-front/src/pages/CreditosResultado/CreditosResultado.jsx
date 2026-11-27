import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { syncOrder } from '../../services/billing.service.js'
import { useAuth } from '../../hooks/useAuth.js'
import StepHeading from '../../components/molecules/StepHeading/StepHeading.jsx'
import StatusMessage from '../../components/molecules/StatusMessage/StatusMessage.jsx'
import Button from '../../components/atoms/Button/Button.jsx'
import { NEW_ANALYSIS_LINK } from '../../utils/flowSteps.js'

/**
 * Vuelta del pago (Mercado Pago o checkout simulado): consulta cómo quedó la compra
 * y muestra el saldo actualizado. No se fía del parámetro de la URL, siempre re-verifica.
 */
function CreditosResultado() {
  const [params] = useSearchParams()
  const orderId = params.get('compra')
  const { setCredits } = useAuth()
  const [state, setState] = useState({ status: orderId ? 'loading' : 'error', order: null, credits: null })

  useEffect(() => {
    if (!orderId) return undefined
    let active = true
    syncOrder(orderId)
      .then(({ order, credits }) => {
        if (!active) return
        if (credits) setCredits(credits)
        setState({ status: 'ok', order, credits })
      })
      .catch(() => active && setState({ status: 'error', order: null, credits: null }))
    return () => {
      active = false
    }
  }, [orderId, setCredits])

  const { order, credits } = state

  return (
    <section className="creditos">
      <StepHeading title="Resultado de tu compra" />

      {state.status === 'loading' && <div className="flow-skeleton" aria-busy="true" aria-label="Verificando el pago" />}

      {state.status === 'error' && (
        <StatusMessage variant="error">No pudimos verificar la compra. Revisá tu saldo en Mis créditos.</StatusMessage>
      )}

      {state.status === 'ok' && order.status === 'paid' && (
        <StatusMessage variant="success">
          ¡Listo! Acreditamos {order.credits} {order.credits === 1 ? 'crédito' : 'créditos'}. Ahora tenés{' '}
          {credits.paid} {credits.paid === 1 ? 'crédito pago' : 'créditos pagos'}.
        </StatusMessage>
      )}

      {state.status === 'ok' && order.status === 'pending' && (
        <StatusMessage>
          El pago todavía está pendiente. Cuando se apruebe vamos a acreditar los créditos automáticamente.
        </StatusMessage>
      )}

      {state.status === 'ok' && order.status === 'failed' && (
        <StatusMessage variant="error">El pago no se completó y no se te cobró. Podés intentar de nuevo.</StatusMessage>
      )}

      <div className="creditos-simulado-actions" style={{ display: 'flex', gap: 'var(--space-12)', flexWrap: 'wrap' }}>
        <Button variant="primary" size="l" {...NEW_ANALYSIS_LINK}>
          Analizar una zona
        </Button>
        <Button variant="secondary" size="l" to="/creditos">
          Mis créditos
        </Button>
      </div>
    </section>
  )
}

export default CreditosResultado
