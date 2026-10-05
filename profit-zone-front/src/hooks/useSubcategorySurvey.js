import { useEffect, useState } from 'react'
import { fetchSubcategorySurvey } from '../services/catalog.service.js'

/**
 * Trae la encuesta de una subcategoría desde
 * GET /api/categories/:categoryCode/subcategories/:subcategoryCode/questions.
 */
export function useSubcategorySurvey(categoryCode, subcategoryCode) {
  const [state, setState] = useState({ status: 'loading', data: null, error: null })

  useEffect(() => {
    let cancelled = false

    fetchSubcategorySurvey(categoryCode, subcategoryCode)
      .then((data) => {
        if (!cancelled) setState({ status: 'ok', data, error: null })
      })
      .catch((error) => {
        if (!cancelled) {
          setState({
            status: 'error',
            data: null,
            error: error.response?.data?.message ?? error.message,
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [categoryCode, subcategoryCode])

  return state
}
