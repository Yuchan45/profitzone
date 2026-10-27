import { useSyncExternalStore } from 'react'

/** true mientras la media query (ej. '(max-width: 1023px)') se cumpla; se actualiza al cambiar. */
export function useMediaQuery(query) {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}
