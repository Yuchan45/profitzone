import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { askZoni } from '../../../services/assistant.service.js'
import { useZoni } from '../../../context/ZoniContext.jsx'
import Icon from '../../atoms/Icon/Icon.jsx'
import './ZoniChat.css'

const GREETING = '¡Hola! Soy Zoni, tu copiloto de zona. Te ayudo a entender los datos, los créditos o cómo elegir dónde abrir. ¿Qué querés saber?'

const GENERAL_SUGGESTIONS = ['¿Cómo funcionan los créditos?', '¿De dónde salen los datos?', '¿Qué rubros y zonas cubren?']
const REPORT_SUGGESTIONS = ['Explicame este reporte', '¿Cuáles son las debilidades de esta zona?', '¿Qué debería validar antes de alquilar?']

// Pantallas donde el chat se oculta: el formulario de ingreso no necesita distracciones
const HIDDEN_ON = ['/login', '/registro', '/recuperar-contrasena', '/restablecer-contrasena']

// Texto de la respuesta a React: párrafos, listas con guiones y **negritas** (sin HTML crudo)
function inline(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith('**') && part.endsWith('**') ? <strong key={index}>{part.slice(2, -2)}</strong> : part,
  )
}

function RichText({ text }) {
  const blocks = []
  let list = null
  for (const line of text.split('\n')) {
    const bullet = line.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)$/)
    if (bullet) {
      list ??= []
      list.push(bullet[1])
      continue
    }
    if (list) {
      blocks.push({ type: 'list', items: list })
      list = null
    }
    if (line.trim()) blocks.push({ type: 'p', text: line.trim() })
  }
  if (list) blocks.push({ type: 'list', items: list })

  return blocks.map((block, index) =>
    block.type === 'list' ? (
      <ul key={index}>
        {block.items.map((item, i) => (
          <li key={i}>{inline(item)}</li>
        ))}
      </ul>
    ) : (
      <p key={index}>{inline(block.text)}</p>
    ),
  )
}

/**
 * Zoni: chat flotante con IA. Vive en toda la app (se monta una vez en App) y responde sabiendo
 * en qué pantalla está el usuario y, en un reporte, qué dice ese reporte (ZoniContext).
 */
function ZoniChat() {
  const { pathname } = useLocation()
  const { pageContext } = useZoni()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const listRef = useRef(null)
  const inputRef = useRef(null)

  const hidden = HIDDEN_ON.includes(pathname)

  // Siempre mostrar lo último
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages, sending, open])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  // Esc cierra el chat
  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => event.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (hidden) return null

  const send = async (raw) => {
    const content = raw.trim()
    if (!content || sending) return
    const next = [...messages, { role: 'user', content }]
    setMessages(next)
    setInput('')
    setError(null)
    setSending(true)
    try {
      const context = [`Pantalla actual: ${pathname}`, pageContext].filter(Boolean).join('\n')
      const reply = await askZoni(next, context)
      setMessages([...next, { role: 'assistant', content: reply }])
    } catch (err) {
      setError(err.response?.data?.message ?? 'Zoni no pudo responder ahora. Probá de nuevo.')
    } finally {
      setSending(false)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    send(input)
  }

  const suggestions = pageContext ? REPORT_SUGGESTIONS : GENERAL_SUGGESTIONS

  return (
    <div className="zoni">
      {open && (
        <section className="zoni-panel" role="dialog" aria-label="Zoni, asistente de ProfitZone">
          <header className="zoni-header">
            <span className="zoni-avatar" aria-hidden="true">
              <Icon name="sparkles" size={18} />
            </span>
            <span className="zoni-title">
              Zoni
              <small>Tu copiloto de zona · IA</small>
            </span>
            <button type="button" className="zoni-close" onClick={() => setOpen(false)} aria-label="Cerrar el chat">
              <Icon name="x" size={18} />
            </button>
          </header>

          <div className="zoni-messages" ref={listRef} aria-live="polite">
            <div className="zoni-bubble zoni-bubble--assistant">
              <p>{GREETING}</p>
            </div>
            {messages.map((message, index) => (
              <div key={index} className={`zoni-bubble zoni-bubble--${message.role}`}>
                {message.role === 'assistant' ? <RichText text={message.content} /> : <p>{message.content}</p>}
              </div>
            ))}
            {sending && (
              <div className="zoni-bubble zoni-bubble--assistant zoni-typing" aria-label="Zoni está escribiendo">
                <span />
                <span />
                <span />
              </div>
            )}
            {error && <p className="zoni-error">{error}</p>}
            {messages.length === 0 && (
              <ul className="zoni-suggestions" aria-label="Preguntas sugeridas">
                {suggestions.map((suggestion) => (
                  <li key={suggestion}>
                    <button type="button" onClick={() => send(suggestion)} disabled={sending}>
                      {suggestion}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <form className="zoni-form" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              className="zoni-input"
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Preguntale a Zoni…"
              maxLength={500}
              aria-label="Tu pregunta"
            />
            <button type="submit" className="zoni-send" disabled={sending || !input.trim()} aria-label="Enviar">
              <Icon name="send" size={18} />
            </button>
          </form>
          <p className="zoni-disclaimer">Zoni es una IA y puede equivocarse. No reemplaza asesoramiento profesional.</p>
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
