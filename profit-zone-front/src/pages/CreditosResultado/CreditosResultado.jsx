import { useSearchParams } from 'react-router-dom'
import { useOrderSync } from '../../hooks/useOrderSync.js'
import StepHeading from '../../components/molecules/StepHeading/StepHeading.jsx'
import StatusMessage from '../../components/molecules/StatusMessage/StatusMessage.jsx'
import Button from '../../components/atoms/Button/Button.jsx'
import { NEW_ANALYSIS_LINK } from '../../utils/flowSteps.js'
import { pluralCredits } from '../../utils/plans.js'
import './CreditosResultado.css'

/**
 * Vuelta del pago (Mercado Pago o checkout simulado): consulta cómo quedó la compra
 * y muestra el saldo actualizado. No se fía del parámetro de la URL, siempre re-verifica.
 */
function CreditosResultado() {
  const [params] = useSearchParams()
  const orderId = params.get('compra')
  const state = useOrderSync(orderId)
  const { order, credits } = state.data ?? {}

  return (
    <section className="creditos-resultado">
      <StepHeading title="Resultado de tu compra" />

      {state.status === 'loading' && <div className="flow-skeleton" aria-busy="true" aria-label="Verificando el pago" />}

      {state.status === 'error' && (
        <StatusMessage variant="error">No pudimos verificar la compra. Revisá tu saldo en Mis créditos.</StatusMessage>
      )}

      {state.status === 'ok' && order.status === 'paid' && (
        <StatusMessage variant="success">
          ¡Listo! Acreditamos {pluralCredits(order.credits)}. Ahora tenés {pluralCredits(credits.paid)}{' '}
          {credits.paid === 1 ? 'pago' : 'pagos'}.
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

      <div className="creditos-resultado-actions">
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
