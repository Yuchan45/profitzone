import { useCallback, useEffect, useRef, useState } from 'react'

// Ritmo del tipeo: unos 80 caracteres por segundo, pero ninguna respuesta tarda más de ~3 s
const CHARS_PER_SECOND = 80
const MAX_SECONDS = 3

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

/**
 * Muestra `text` de a poco, como si se estuviera escribiendo (estilo ChatGPT). `key` identifica
 * el texto que se anima: con `key` null (o con "reducir movimiento") se muestra completo.
 * Devuelve `{ shown, done, finish }`; `finish()` corta la animación y muestra todo.
 */
export function useTypewriter(text, key) {
  const active = key != null && !prefersReducedMotion()
  const [progress, setProgress] = useState({ key: null, count: 0 })
  // Clave del texto que se pidió terminar: el loop la mira en cada cuadro
  const finishedKey = useRef(null)

  useEffect(() => {
    if (!active) return undefined
    const speed = Math.max(CHARS_PER_SECOND, text.length / MAX_SECONDS)
    const start = performance.now()
    let frame

    const tick = (now) => {
      const skipped = finishedKey.current === key
      const count = skipped ? text.length : Math.min(text.length, Math.floor(((now - start) / 1000) * speed))
      setProgress({ key, count })
      if (count < text.length) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [active, key, text])

  const finish = useCallback(() => {
    finishedKey.current = key
    setProgress({ key, count: text.length })
  }, [key, text])

  if (!active) return { shown: text, done: true, finish }
  const count = progress.key === key ? progress.count : 0
  return { shown: text.slice(0, count), done: count >= text.length, finish }
}
