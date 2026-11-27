import { useCallback, useEffect, useState } from 'react'

// Tamaño del panel de Zoni: se agranda o achica arrastrando la esquina o con el botón de
// expandir. Se recuerda en localStorage (es una preferencia visual, no un dato sensible).
const STORAGE_KEY = 'zoni:panel-size'
const MIN = { width: 320, height: 420 }
const DEFAULT = { width: 400, height: 600 }
const EXPANDED_WIDTH = 760
// Lugar que hay que dejar libre: bordes de la pantalla y el botón flotante de abajo
const MARGIN = { x: 32, y: 112 }
// Lo que mueve cada flecha del teclado sobre la esquina
const KEYBOARD_STEP = 32

function clamp({ width, height }) {
  const maxWidth = Math.max(MIN.width, window.innerWidth - MARGIN.x)
  const maxHeight = Math.max(MIN.height, window.innerHeight - MARGIN.y)
  return {
    width: Math.round(Math.min(maxWidth, Math.max(MIN.width, width))),
    height: Math.round(Math.min(maxHeight, Math.max(MIN.height, height))),
  }
}

function readSavedSize() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (Number.isFinite(saved?.width) && Number.isFinite(saved?.height)) return saved
  } catch {
    // Sin localStorage (o con un valor roto) se usa el tamaño por defecto
  }
  return DEFAULT
}

/**
 * Tamaño de un panel anclado abajo a la derecha: `startResize` va en el `onPointerDown` de la
 * esquina de arriba a la izquierda y `onResizeKey` en su `onKeyDown`. `expanded` lo lleva al
 * tamaño grande; arrastrar la esquina lo vuelve a un tamaño propio.
 */
export function useResizablePanel() {
  const [size, setSize] = useState(readSavedSize)
  const [expanded, setExpanded] = useState(false)
  const [, setViewportVersion] = useState(0)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(size))
    } catch {
      // Sin localStorage el tamaño dura hasta recargar
    }
  }, [size])

  // Al cambiar el tamaño de la ventana se vuelve a acotar el panel para que no quede afuera
  useEffect(() => {
    const onResize = () => setViewportVersion((version) => version + 1)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const startResize = useCallback((event) => {
    if (event.button !== 0) return
    event.preventDefault()
    const panel = event.currentTarget.parentElement.getBoundingClientRect()
    const origin = { x: event.clientX, y: event.clientY, width: panel.width, height: panel.height }
    setExpanded(false)
    document.body.classList.add('zoni-resizing')

    // El panel crece hacia arriba y a la izquierda: se suma lo que el puntero se alejó
    const onMove = (moveEvent) =>
      setSize(
        clamp({
          width: origin.width + (origin.x - moveEvent.clientX),
          height: origin.height + (origin.y - moveEvent.clientY),
        }),
      )
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      document.body.classList.remove('zoni-resizing')
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }, [])

  const onResizeKey = useCallback((event) => {
    const deltas = {
      ArrowLeft: [KEYBOARD_STEP, 0],
      ArrowRight: [-KEYBOARD_STEP, 0],
      ArrowUp: [0, KEYBOARD_STEP],
      ArrowDown: [0, -KEYBOARD_STEP],
    }
    const delta = deltas[event.key]
    if (!delta) return
    event.preventDefault()
    setExpanded(false)
    setSize((current) => clamp({ width: current.width + delta[0], height: current.height + delta[1] }))
  }, [])

  const toggleExpanded = useCallback(() => setExpanded((value) => !value), [])

  const current = expanded ? clamp({ width: EXPANDED_WIDTH, height: Infinity }) : clamp(size)
  return { size: current, expanded, toggleExpanded, startResize, onResizeKey }
}
