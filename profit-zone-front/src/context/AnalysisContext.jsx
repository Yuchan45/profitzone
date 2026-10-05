import { useEffect, useMemo, useState } from 'react'
import { AnalysisContext } from './analysisContextValue.js'

// Análisis en curso del wizard. Se guarda en sessionStorage para que sobreviva
// a un refresh, pero no queda entre pestañas ni sesiones.
const STORAGE_KEY = 'profitzone:analysis'

// answers: { [questionCode]: optionCode[] } (las de opción única tienen un solo elemento)
const EMPTY_ANALYSIS = { category: null, subcategory: null, answers: {} }

function readStoredAnalysis() {
  try {
    const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY))
    return stored ? { ...EMPTY_ANALYSIS, ...stored } : EMPTY_ANALYSIS
  } catch {
    return EMPTY_ANALYSIS
  }
}

export function AnalysisProvider({ children }) {
  const [analysis, setAnalysis] = useState(readStoredAnalysis)

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(analysis))
    } catch {
      // Sin storage (modo privado, cuota llena) el análisis sigue en memoria.
    }
  }, [analysis])

  const value = useMemo(
    () => ({
      analysis,
      // category y subcategory: { code, name }. Si cambia el rubro, las
      // respuestas anteriores dejan de aplicar.
      setRubro: (category, subcategory) =>
        setAnalysis((prev) => ({
          ...prev,
          category,
          subcategory,
          answers:
            prev.category?.code === category.code && prev.subcategory?.code === subcategory.code
              ? prev.answers
              : {},
        })),
      setAnswer: (questionCode, optionCodes) =>
        setAnalysis((prev) => ({
          ...prev,
          answers: { ...prev.answers, [questionCode]: optionCodes },
        })),
      resetAnalysis: () => setAnalysis(EMPTY_ANALYSIS),
    }),
    [analysis],
  )

  return <AnalysisContext.Provider value={value}>{children}</AnalysisContext.Provider>
}
