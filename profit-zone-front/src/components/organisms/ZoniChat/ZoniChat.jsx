import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { askZoni } from '../../../services/assistant.service.js'
import { useZoni } from '../../../hooks/useZoni.js'
import { useTypewriter } from '../../../hooks/useTypewriter.js'
import { useResizablePanel } from '../../../hooks/useResizablePanel.js'
import { HOW_IT_WORKS, screenLabel, suggestionsFor } from '../../../utils/zoniGuide.js'
import Icon from '../../atoms/Icon/Icon.jsx'
import ChatMessage from '../../molecules/ChatMessage/ChatMessage.jsx'
import './ZoniChat.css'

const GREETING =
  '¡Hola! Soy **Zoni**, tu copiloto de zona. Te explico cómo funciona ProfitZone, qué significa cada dato del reporte y cómo se usan los créditos.'

// Pantallas donde el chat se oculta: el formulario de ingreso no necesita distracciones
const HIDDEN_ON = ['/login', '/registro', '/recuperar-contrasena', '/restablecer-contrasena']

// La conversación sobrevive a recargar la pestaña (no a cerrarla). Solo texto: nada de sesión
const STORAGE_KEY = 'zoni:conversation'
const MAX_STORED = 30
const MAX_INPUT = 500
const INPUT_MAX_HEIGHT = 140
// Si el usuario está a menos de esto del final, el chat lo sigue mientras Zoni escribe
const STICK_THRESHOLD = 80

function loadConversation() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY))
    return Array.isArray(saved) ? saved.filter((m) => m?.id && m?.role && typeof m.content === 'string') : []
  } catch {
    return []
  }
}

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const isMobile = () => window.matchMedia('(max-width: 640px)').matches

/**
 * Zoni: chat flotante con IA. Vive en toda la app (se monta una vez en App) y responde sabiendo
 * en qué pantalla está el usuario y, en un reporte, qué dice ese reporte (ZoniContext).
 * Las respuestas aparecen tipeándose; el panel se agranda, se achica o se arrastra desde la esquina.
 */
function ZoniChat() {
  const { pathname } = useLocation()
  const { pageContext } = useZoni()
  const panel = useResizablePanel()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState(loadConversation)
  const [typingId, setTypingId] = useState(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  const listRef = useRef(null)
  const inputRef = useRef(null)
  const stickToBottom = useRef(true)
  const request = useRef(null)

  const typingMessage = messages.find((message) => message.id === typingId)
  const typewriter = useTypewriter(typingMessage?.content ?? '', typingMessage ? typingId : null)
  const typing = Boolean(typingMessage) && !typewriter.done
  const busy = sending || typing

  const hidden = HIDDEN_ON.includes(pathname)

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_STORED)))
    } catch {
      // Sin sessionStorage la conversación dura hasta recargar
    }
  }, [messages])

  // Sigue el final de la conversación (mientras Zoni escribe, solo si el usuario no subió a leer).
  // Sin conversación queda arriba: primero se lee el saludo
  useEffect(() => {
    const list = listRef.current
    if (list && stickToBottom.current && messages.length > 0) list.scrollTo({ top: list.scrollHeight })
  }, [messages, sending, open, typewriter.shown, error])

  useEffect(() => {
    if (open && !isMobile()) inputRef.current?.focus()
  }, [open])

  // El campo crece con el texto, hasta un tope
  useEffect(() => {
    const field = inputRef.current
    if (!field) return
    field.style.height = 'auto'
    field.style.height = `${Math.min(field.scrollHeight, INPUT_MAX_HEIGHT)}px`
  }, [input, open])

  // Esc cierra el chat
  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => event.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // Al desmontar, una consulta en vuelo se cancela
  useEffect(() => () => request.current?.abort(), [])

  if (hidden) return null

  // `base`: la conversación sobre la que se pregunta (al reintentar, sin la pregunta que falló)
  const send = async (raw, base = messages) => {
    const content = raw.trim()
    if (!content || busy) return
    const question = { id: newId(), role: 'user', content }
    const next = [...base, question]
    setMessages(next)
    setInput('')
    setError(null)
    setSending(true)
    stickToBottom.current = true

    const controller = new AbortController()
    request.current = controller
    try {
      const context = [`Pantalla actual: ${pathname}`, pageContext].filter(Boolean).join('\n')
      const history = next.map(({ role, content: text }) => ({ role, content: text }))
      const reply = await askZoni(history, context, controller.signal)
      const answer = { id: newId(), role: 'assistant', content: reply }
      setMessages([...next, answer])
      setTypingId(answer.id)
    } catch (err) {
      if (controller.signal.aborted) return
      setError(err.response?.data?.message ?? 'Zoni no pudo responder ahora. Probá de nuevo.')
    } finally {
      if (request.current === controller) request.current = null
      setSending(false)
    }
  }

  // Corta lo que esté pasando: la consulta en vuelo o la respuesta que se está escribiendo
  const stop = () => {
    if (sending) request.current?.abort()
    else typewriter.finish()
  }

  const restart = () => {
    request.current?.abort()
    setMessages([])
    setTypingId(null)
    setError(null)
    setInput('')
    inputRef.current?.focus()
  }

  const copy = async (message) => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopiedId(message.id)
      setTimeout(() => setCopiedId((current) => (current === message.id ? null : current)), 1500)
    } catch {
      // Sin permiso de portapapeles no se copia: el texto se puede seleccionar a mano
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    send(input)
  }

  // Enter envía; Shift+Enter hace un salto de línea
  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      send(input)
    }
  }

  const handleScroll = (event) => {
    const list = event.currentTarget
    stickToBottom.current = list.scrollHeight - list.scrollTop - list.clientHeight < STICK_THRESHOLD
  }

  // En el celular, al seguir un link de la respuesta se cierra el chat para ver la pantalla
  const handleLinkClick = () => {
    if (isMobile()) setOpen(false)
  }

  const asked = messages.filter((message) => message.role === 'user').map((message) => message.content)
  const suggestions = suggestionsFor(pathname, asked)
  const where = pageContext ? 'un reporte de zona' : screenLabel(pathname)
  const empty = messages.length === 0

  const suggestionList = !busy && suggestions.length > 0 && (
    <ul
      className={`zoni-suggestions ${empty ? 'zoni-suggestions--inline' : 'zoni-suggestions--compact'}`}
      aria-label="Preguntas sugeridas"
    >
      {suggestions.slice(0, empty ? 4 : 3).map((suggestion) => (
        <li key={suggestion}>
          <button type="button" onClick={() => send(suggestion)}>
            {suggestion}
          </button>
        </li>
      ))}
    </ul>
  )

  return (
    <div className="zoni">
      {open && (
        <section
          className={`zoni-panel${panel.expanded ? ' zoni-panel--expanded' : ''}`}
          role="dialog"
          aria-label="Zoni, asistente de ProfitZone"
          style={{ '--zoni-width': `${panel.size.width}px`, '--zoni-height': `${panel.size.height}px` }}
        >
          <div
            className="zoni-resize"
            role="separator"
            aria-orientation="horizontal"
            aria-label="Cambiar el tamaño del chat (arrastrá o usá las flechas)"
            tabIndex={0}
            onPointerDown={panel.startResize}
            onKeyDown={panel.onResizeKey}
          />

          <header className="zoni-header">
            <span className="zoni-avatar" aria-hidden="true">
              <Icon name="sparkles" size={18} />
              <span className="zoni-avatar-status" />
            </span>
            <span className="zoni-title">
              Zoni
              <small>Asistente con IA · te explica ProfitZone</small>
            </span>
            <div className="zoni-header-actions">
              {!empty && (
                <button type="button" className="zoni-icon-button" onClick={restart} title="Nueva conversación">
                  <Icon name="rotate-ccw" size={17} />
                  <span className="zoni-sr-only">Nueva conversación</span>
                </button>
              )}
              <button
                type="button"
                className="zoni-icon-button zoni-icon-button--expand"
                onClick={panel.toggleExpanded}
                title={panel.expanded ? 'Achicar el chat' : 'Agrandar el chat'}
              >
                <Icon name={panel.expanded ? 'minimize-2' : 'maximize-2'} size={17} />
                <span className="zoni-sr-only">{panel.expanded ? 'Achicar el chat' : 'Agrandar el chat'}</span>
              </button>
              <button type="button" className="zoni-icon-button" onClick={() => setOpen(false)} title="Cerrar">
                <Icon name="x" size={18} />
                <span className="zoni-sr-only">Cerrar el chat</span>
              </button>
            </div>
          </header>

          <div className="zoni-messages" ref={listRef} onScroll={handleScroll} aria-live="polite">
            <ChatMessage role="assistant" text={GREETING} onLinkClick={handleLinkClick} />

            {empty && (
              <div className="zoni-guide">
                <p className="zoni-guide-title">Cómo funciona</p>
                <ol className="zoni-guide-steps">
                  {HOW_IT_WORKS.map((step, index) => (
                    <li key={step.title} className="zoni-guide-step">
                      <span className="zoni-guide-number" aria-hidden="true">
                        {index + 1}
                      </span>
                      <span>
                        <strong>{step.title}</strong>
                        {step.text}
                      </span>
                    </li>
                  ))}
                </ol>
                {where && (
                  <p className="zoni-guide-where">
                    <Icon name="map-pin" size={14} />
                    Estás en {where}. Preguntame lo que quieras sobre esta pantalla.
                  </p>
                )}
              </div>
            )}

            {/* Sin conversación, las sugerencias van con la guía y se desplazan con ella */}
            {empty && suggestionList}

            {messages.map((message) => {
              const isTyping = message.id === typingId && typing
              return (
                <ChatMessage
                  key={message.id}
                  role={message.role}
                  text={message.id === typingId ? typewriter.shown : message.content}
                  typing={isTyping}
                  onCopy={message.role === 'assistant' ? () => copy(message) : undefined}
                  copied={copiedId === message.id}
                  onLinkClick={handleLinkClick}
                />
              )
            })}

            {sending && (
              <div className="zoni-thinking" role="status">
                <span className="zoni-thinking-dots" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
                Zoni está pensando…
              </div>
            )}

            {error && (
              <div className="zoni-error" role="alert">
                <span>{error}</span>
                <button
                  type="button"
                  className="zoni-error-retry"
                  onClick={() => {
                    const last = messages.at(-1)
                    if (last?.role === 'user') send(last.content, messages.slice(0, -1))
                  }}
                >
                  Reintentar
                </button>
              </div>
            )}
          </div>

          {/* Con conversación, una fila de sugerencias arriba del campo */}
          {!empty && suggestionList}

          <form className="zoni-form" onSubmit={handleSubmit}>
            <div className="zoni-composer">
              <textarea
                ref={inputRef}
                className="zoni-input"
                rows={1}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Preguntale a Zoni…"
                maxLength={MAX_INPUT}
                aria-label="Tu pregunta"
              />
              {busy ? (
                <button type="button" className="zoni-send zoni-send--stop" onClick={stop} title="Detener">
                  <Icon name="square" size={14} />
                  <span className="zoni-sr-only">Detener la respuesta</span>
                </button>
              ) : (
                <button type="submit" className="zoni-send" disabled={!input.trim()} title="Enviar">
                  <Icon name="arrow-up" size={18} />
                  <span className="zoni-sr-only">Enviar</span>
                </button>
              )}
            </div>
            <p className="zoni-disclaimer">
              Zoni es una IA y puede equivocarse
              <span className="zoni-disclaimer-keys"> · Shift+Enter, nueva línea</span>
            </p>
          </form>
        </section>
      )}

      <button
        type="button"
        className={`zoni-fab${open ? ' zoni-fab--open' : ''}`}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? 'Cerrar el chat con Zoni' : 'Abrir el chat con Zoni'}
      >
        <Icon name={open ? 'x' : 'sparkles'} size={22} />
        {!open && <span className="zoni-fab-label">Preguntale a Zoni</span>}
      </button>
    </div>
  )
}

export default ZoniChat
