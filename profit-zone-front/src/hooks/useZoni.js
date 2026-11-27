import { useContext } from 'react'
import { ZoniContext } from '../context/zoniContextValue.js'

/** Lo que la pantalla actual le contó a Zoni (`pageContext`) y cómo cambiarlo. */
export function useZoni() {
  return useContext(ZoniContext)
}
