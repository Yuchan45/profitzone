import { useState } from 'react'
import { upgradeAnalysis } from '../../../services/analyses.service.js'
import { useAuth } from '../../../hooks/useAuth.js'
import Badge from '../../atoms/Badge/Badge.jsx'
import Button from '../../atoms/Button/Button.jsx'
import Icon from '../../atoms/Icon/Icon.jsx'
import StatusMessage from '../../molecules/StatusMessage/StatusMessage.jsx'
import './TierBanner.css'

/**
 * Nivel del reporte: en el básico ofrece pasar al completo con 1 crédito pago (Google, avisos
 * de alquiler, PDF); en el completo muestra el nivel y el botón de PDF.
 * No muestra nada si el reporte no trae nivel (ej. el reporte de ejemplo).
 * - `report`: el resultado de useAnalysisReport. Al mejorar, lo vuelve a pedir (`report.retry`),
 *   y el nuevo reporte trae el saldo actualizado.
 */
function TierBanner({ report }) {
  const { user } = useAuth()
  const [upgrading, setUpgrading] = useState(false)
  const [error, setError] = useState(null)

  const data = report.data
  if (report.status !== 'ok' || !data?.tier) return null

  if (data.tier === 'complete') {
    return (
      <aside className="tier-banner tier-banner--complete">
        <span className="tier-banner-text">
          <Icon name="circle-check" size={18} />
          <Badge variant="strength">Análisis completo</Badge>
          Con calificaciones de Google, avisos de alquiler y PDF.
        </span>
        <Button variant="secondary" size="m" onClick={() => window.print()}>
          <Icon name="download" size={16} />
          Descargar PDF
        </Button>
      </aside>
    )
  }

  const isAdmin = user?.role === 'admin'
  const paid = data.credits?.paid ?? user?.credits?.paid ?? 0
  const canPay = isAdmin || paid > 0

  const upgrade = async () => {
    setUpgrading(true)
    setError(null)
    try {
      await upgradeAnalysis(data.analysis.id)
      report.retry()
    } catch (err) {
      setError(err.response?.data?.message ?? err.message)
    } finally {
      setUpgrading(false)
    }
  }

  return (
    <aside className="tier-banner tier-banner--basic">
      <div className="tier-banner-body">
        <span className="tier-banner-text">
          <Icon name="zap" size={18} />
          <Badge variant="neutral">Análisis básico</Badge>
          Radio de hasta 600 m, sin calificaciones de Google, sin avisos de alquiler ni PDF.
        </span>
        <p className="tier-banner-hint">
          {canPay
            ? `Pasalo a completo con 1 crédito pago${isAdmin ? '' : ` (tenés ${paid})`}.`
            : 'Necesitás 1 crédito pago para el análisis completo.'}
        </p>
      </div>
      {canPay ? (
        <Button variant="primary" size="m" onClick={upgrade} disabled={upgrading}>
          {upgrading ? 'Mejorando…' : 'Mejorar a completo'}
        </Button>
      ) : (
        <Button variant="primary" size="m" to="/creditos">
          Comprar créditos
        </Button>
      )}
      {error && <StatusMessage variant="error">No pudimos mejorar el análisis: {error}</StatusMessage>}
    </aside>
  )
}

export default TierBanner
