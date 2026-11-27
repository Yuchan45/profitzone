import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { fetchOrder, simulatePayment } from '../../services/billing.service.js'
import StepHeading from '../../components/molecules/StepHeading/StepHeading.jsx'
import StatusMessage from '../../components/molecules/StatusMessage/StatusMessage.jsx'
import Button from '../../components/atoms/Button/Button.jsx'
import { formatCurrency } from '../../utils/formatters.js'
import './CreditosSimulado.css'

/**
 * Checkout de demostración: reemplaza a Mercado Pago cuando la pasarela está en modo demo.
 * Confirmar acredita los créditos sin cobrar nada.
 */
function CreditosSimulado() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [state, setState] = useState({ status: 'loading', order: null, error: null })
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState(null)

  useEffect(() => {
    let active = true
    fetchOrder(id)
      .then(({ order }) => active && setState({ status: 'ok', order, error: null }))
      .catch((error) =>
        active &&
        setState({ status: 'error', order: null, error: error.response?.data?.message ?? error.message }),
      )
    return () => {
      active = false
    }
  }, [id])

  const pay = async () => {
    setPaying(true)
    setPayError(null)
    try {
      await simulatePayment(id)
      navigate(`/creditos/resultado?compra=${id}&resultado=ok`, { replace: true })
    } catch (error) {
      setPayError(error.response?.data?.message ?? error.message)
      setPaying(false)
    }
  }

  const { order } = state

  return (
    <section className="creditos-simulado">
      <StepHeading title="Confirmar compra" subtitle="Pasarela de pago de demostración" />

      {state.status === 'loading' && <div className="flow-skeleton" aria-busy="true" aria-label="Cargando la compra" />}

      {state.status === 'error' && (
        <StatusMessage variant="error">
          No encontramos esa compra: {state.error}. <Link to="/creditos">Volver a Mis créditos</Link>
        </StatusMessage>
      )}

      {state.status === 'ok' && order.status === 'paid' && (
        <StatusMessage variant="success">
          Esta compra ya estaba acreditada. <Link to="/creditos">Ver mis créditos</Link>
        </StatusMessage>
      )}

      {state.status === 'ok' && order.status !== 'paid' && (
        <div className="creditos-simulado-card">
          <dl className="creditos-simulado-summary">
            <div>
              <dt>Compra</dt>
              <dd>
                {order.credits} {order.credits === 1 ? 'crédito' : 'créditos'} de análisis completo
              </dd>
            </div>
            <div>
              <dt>Total en pesos</dt>
              <dd>{formatCurrency(order.amountArs, 'ARS', { decimals: 0 })}</dd>
            </div>
            <div>
              <dt>Referencia en dólares</dt>
              <dd>USD {order.amountUsd}</dd>
            </div>
          </dl>

          <StatusMessage>
            Es una simulación: al confirmar se acreditan los créditos pero no se cobra nada.
          </StatusMessage>
          {payError && <StatusMessage variant="error">No pudimos confirmar el pago: {payError}</StatusMessage>}

          <div className="creditos-simulado-actions">
            <Button variant="primary" size="l" onClick={pay} disabled={paying}>
              {paying ? 'Confirmando…' : 'Confirmar pago simulado'}
            </Button>
            <Button variant="ghost" size="l" to="/creditos" disabled={paying}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}

export default CreditosSimulado
