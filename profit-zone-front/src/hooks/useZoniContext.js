import { useEffect } from 'react'
import { useZoni } from './useZoni.js'

/** Declara el contexto de la pantalla actual mientras está montada (null o '' lo limpia). */
export function useZoniContext(text) {
  const { setPageContext } = useZoni()
  useEffect(() => {
    setPageContext(text ?? '')
    return () => setPageContext('')
  }, [text, setPageContext])
}
