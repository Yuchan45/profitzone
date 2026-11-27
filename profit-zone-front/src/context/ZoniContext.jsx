import { useMemo, useState } from 'react'
import { ZoniContext } from './zoniContextValue.js'

/** Guarda lo que el usuario está viendo (ej. el resumen del reporte) para que Zoni lo use al responder. */
export function ZoniProvider({ children }) {
  const [pageContext, setPageContext] = useState('')
  const value = useMemo(() => ({ pageContext, setPageContext }), [pageContext])
  return <ZoniContext.Provider value={value}>{children}</ZoniContext.Provider>
}
