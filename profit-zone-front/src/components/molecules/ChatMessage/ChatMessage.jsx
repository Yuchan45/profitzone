import Icon from '../../atoms/Icon/Icon.jsx'
import RichText from '../../atoms/RichText/RichText.jsx'
import './ChatMessage.css'

/**
 * Un mensaje del chat de Zoni. `role`: 'assistant' (con avatar y formato) o 'user'.
 * - `typing`: la respuesta se está escribiendo (muestra el cursor y oculta las acciones).
 * - `onCopy` / `copied`: botón para copiar la respuesta y su confirmación.
 * - `onLinkClick`: al tocar un link interno de la respuesta.
 */
function ChatMessage({ role, text, typing = false, onCopy, copied = false, onLinkClick }) {
  if (role === 'user') {
    return (
      <div className="chat-message chat-message--user">
        <p className="chat-message-bubble">{text}</p>
      </div>
    )
  }

  return (
    <div className="chat-message chat-message--assistant">
      <span className="chat-message-avatar" aria-hidden="true">
        <Icon name="sparkles" size={14} />
      </span>
      <div className="chat-message-body">
        <div className={`chat-message-bubble${typing ? ' chat-message-bubble--typing' : ''}`}>
          <RichText text={text} onLinkClick={onLinkClick} />
        </div>
        {onCopy && !typing && (
          <button type="button" className="chat-message-action" onClick={onCopy}>
            <Icon name={copied ? 'check' : 'copy'} size={13} />
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        )}
      </div>
    </div>
  )
}

export default ChatMessage
