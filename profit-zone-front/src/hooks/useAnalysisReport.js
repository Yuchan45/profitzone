import { useCallback, useEffect, useState } from 'react'
import { fetchAnalysisReport } from '../services/analyses.service.js'

const LOADING = { status: 'loading', data: null, error: null }

// Último reporte traído de cada análisis (en memoria, por pestaña). El paso 5 reusa el
// del paso 4: armar el reporte consulta fuentes pagas (Google Places) y no hace falta repetirlo.
const reportCache = new Map()

/**
 * Trae el reporte de zona de un análisis desde GET /api/analyses/:id/report.
 * Con `reuse` usa el último reporte ya traído en esta pestaña, si hay; si no, lo pide.
 * `retry()` vuelve a pedirlo siempre (por ejemplo, después de un error).
 */
export function useAnalysisReport(analysisId, { reuse = false } = {}) {
  const [attempt, setAttempt] = useState(0)
  // `forKey` evita mostrar el resultado anterior mientras carga el de otro análisis
  // (React Router reutiliza la página al cambiar el :id) o mientras se reintenta
  const key = `${analysisId}:${attempt}`
  const [state, setState] = useState({ ...LOADING, forKey: key })
  const useCached = reuse && attempt === 0 && reportCache.has(analysisId)

  useEffect(() => {
    if (useCached) return undefined
    let cancelled = false
    const forKey = `${analysisId}:${attempt}`

    fetchAnalysisReport(analysisId)
      .then((data) => {
        if (cancelled) return
        // Una respuesta descartada (llegó tarde) no pisa en la caché a una más nueva
        reportCache.set(analysisId, data)
        setState({ status: 'ok', data, error: null, forKey })
      })
      .catch((error) => {
        if (!cancelled) {
          setState({
            status: 'error',
            data: null,
            error: error.response?.data?.message ?? error.message,
            forKey,
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [analysisId, attempt, useCached])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])

  if (useCached) return { status: 'ok', data: reportCache.get(analysisId), error: null, retry }
  if (state.forKey !== key) return { ...LOADING, retry }
  const { status, data, error } = state
  return { status, data, error, retry }
}
