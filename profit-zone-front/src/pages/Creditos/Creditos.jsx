import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePacks } from '../../hooks/usePacks.js'
import { useCreditsSummary } from '../../hooks/useCreditsSummary.js'
import { createCheckout } from '../../services/billing.service.js'
import StepHeading from '../../components/molecules/StepHeading/StepHeading.jsx'
import StatusMessage from '../../components/molecules/StatusMessage/StatusMessage.jsx'
import PackCard from '../../components/molecules/PackCard/PackCard.jsx'
import Icon from '../../components/atoms/Icon/Icon.jsx'
import Button from '../../components/atoms/Button/Button.jsx'
import { formatCurrency, formatDate } from '../../utils/formatters.js'
import { NEW_ANALYSIS_LINK } from '../../utils/flowSteps.js'
import './Creditos.css'

// Cómo se muestra cada movimiento del libro de créditos
const REASONS = {
  signup: 'Regalo de bienvenida',
  purchase: 'Compra de créditos',
  analysis: 'Análisis de una zona',
  upgrade: 'Mejora a análisis completo',
  refund: 'Devolución: el reporte no se pudo generar',
}

function Creditos() {
  const navigate = useNavigate()
  const packs = usePacks()
  const summary = useCreditsSummary()
  const [buying, setBuying] = useState(null)
  const [buyError, setBuyError] = useState(null)

  const credits = summary.data?.credits

  const buy = async (packCode) => {
    setBuying(packCode)
    setBuyError(null)
    try {
      const { checkoutUrl } = await createCheckout(packCode)
      // El checkout simulado es una pantalla propia; Mercado Pago, un sitio externo
      const url = new URL(checkoutUrl, window.location.origin)
      if (url.origin === window.location.origin) navigate(url.pathname + url.search)
      else window.location.assign(url.href)
    } catch (error) {
      setBuyError(error.response?.data?.message ?? error.message)
      setBuying(null)
    }
  }

  const bestPackCode = packs.data?.packs.reduce((best, pack) =>
    pack.pricePerCreditUsd < best.pricePerCreditUsd ? pack : best,
  ).code

  return (
    <section className="creditos">
      <StepHeading
        title="Mis créditos"
        subtitle="Cada análisis usa un crédito. Los créditos gratis son para análisis básicos y los pagos, para análisis completos. No vencen."
      />

      <div className="creditos-balance">
        <div className="creditos-balance-item">
          <span className="creditos-balance-label">Gratis · análisis básico</span>
          <strong className="creditos-balance-value">{credits ? credits.free : '–'}</strong>
        </div>
        <div className="creditos-balance-item creditos-balance-item--paid">
          <span className="creditos-balance-label">Pagos · análisis completo</span>
          <strong className="creditos-balance-value">{credits ? credits.paid : '–'}</strong>
        </div>
        <Button variant="primary" size="m" {...NEW_ANALYSIS_LINK}>
          Analizar una zona
        </Button>
      </div>

      {summary.status === 'error' && (
        <StatusMessage variant="error">No pudimos cargar tu saldo: {summary.error}</StatusMessage>
      )}

      <h2 className="creditos-title">Comprar créditos</h2>

      {packs.status === 'loading' && (
        <div className="creditos-packs" aria-busy="true" aria-label="Cargando los packs">
          <div className="flow-skeleton creditos-skeleton" />
          <div className="flow-skeleton creditos-skeleton" />
          <div className="flow-skeleton creditos-skeleton" />
        </div>
      )}

      {packs.status === 'error' && (
        <StatusMessage variant="error">
          No pudimos cargar los packs: {packs.error}{' '}
          <button type="button" className="creditos-link-button" onClick={packs.retry}>
            Reintentar
          </button>
        </StatusMessage>
      )}

      {packs.status === 'ok' && (
        <>
          <div className="creditos-packs">
            {packs.data.packs.map((pack) => (
              <PackCard
                key={pack.code}
                pack={pack}
                featured={pack.code === bestPackCode}
                onBuy={() => buy(pack.code)}
                buying={buying === pack.code}
                disabled={buying !== null}
              />
            ))}
          </div>
          <p className="creditos-note">
            <Icon name="info" size={14} />
            Precios en dólares de referencia: se cobran en pesos al tipo de cambio de hoy (USD 1 ={' '}
            {formatCurrency(packs.data.usdArsRate, 'ARS', { decimals: 0 })}).
          </p>
          {packs.data.provider === 'mock' && (
            <StatusMessage>
              Modo demostración: la compra es simulada, acredita los créditos sin cobrar nada.
            </StatusMessage>
          )}
        </>
      )}

      {buyError && <StatusMessage variant="error">No pudimos iniciar la compra: {buyError}</StatusMessage>}

      <h2 className="creditos-title">Movimientos</h2>
      {summary.status === 'ok' && summary.data.transactions.length === 0 && (
        <StatusMessage>Todavía no tenés movimientos.</StatusMessage>
      )}
      {summary.status === 'ok' && summary.data.transactions.length > 0 && (
        <ul className="creditos-history">
          {summary.data.transactions.map((transaction) => (
            <li key={transaction.id} className="creditos-history-item">
              <span className="creditos-history-reason">
                {REASONS[transaction.reason] ?? transaction.reason}
                <small>
                  {formatDate(transaction.createdAt)} · {transaction.kind === 'free' ? 'gratis' : 'pago'}
                </small>
              </span>
              <strong
                className={`creditos-history-amount${transaction.amount > 0 ? ' creditos-history-amount--in' : ''}`}
              >
                {transaction.amount > 0 ? `+${transaction.amount}` : transaction.amount}
              </strong>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default Creditos
