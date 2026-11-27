import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const ZoniContext = createContext({ pageContext: '', setPageContext: () => {} })

/** Guarda lo que el usuario está viendo (ej. el resumen del reporte) para que Zoni lo use al responder. */
export function ZoniProvider({ children }) {
  const [pageContext, setPageContext] = useState('')
  const value = useMemo(() => ({ pageContext, setPageContext }), [pageContext])
  return <ZoniContext.Provider value={value}>{children}</ZoniContext.Provider>
}

export function useZoni() {
  return useContext(ZoniContext)
}

/** Declara el contexto de la pantalla actual mientras está montada (null o '' lo limpia). */
export function useZoniContext(text) {
  const { setPageContext } = useZoni()
  useEffect(() => {
    setPageContext(text ?? '')
    return () => setPageContext('')
  }, [text, setPageContext])
}
