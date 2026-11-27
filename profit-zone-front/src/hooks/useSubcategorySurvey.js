import { useEffect, useState } from 'react'
import { fetchSubcategorySurvey } from '../services/catalog.service.js'

const IDLE = { status: 'idle', data: null, error: null }
const LOADING = { status: 'loading', data: null, error: null }

/**
 * Trae la encuesta de un rubro desde
 * GET /api/categories/:categoryCode/subcategories/:subcategoryCode/questions.
 */
export function useSubcategorySurvey(categoryCode, subcategoryCode) {
  const enabled = Boolean(categoryCode && subcategoryCode)
  const key = `${categoryCode}:${subcategoryCode}`
  const [state, setState] = useState({ ...IDLE, forKey: null })

  useEffect(() => {
    if (!enabled) return undefined

    let cancelled = false
    const forKey = `${categoryCode}:${subcategoryCode}`

    fetchSubcategorySurvey(categoryCode, subcategoryCode)
      .then((data) => {
        if (!cancelled) setState({ status: 'ok', data, error: null, forKey })
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
  }, [enabled, categoryCode, subcategoryCode])

  if (!enabled) return IDLE
  if (state.forKey !== key) return LOADING
  return { status: state.status, data: state.data, error: state.error }
}
