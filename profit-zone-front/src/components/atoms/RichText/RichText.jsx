import { Link } from 'react-router-dom'
import './RichText.css'

// Markdown chico, sin HTML crudo: títulos (#), listas (- y 1.), **negritas**, `código` y links.
// Los links a rutas propias ("/creditos") navegan dentro de la app; los externos solo si son https.
const INLINE = /(\*\*[^*\n]+\*\*|`[^`\n]+`|\[[^\]\n]+\]\([^)\s]+\))/g

// Link a medio escribir al final del texto: "[texto" o "[texto](/ruta" (sin el ")" de cierre)
const OPEN_LINK = /\[([^\]\n]*)(\](\([^)\n]*)?)?$/

// Mientras se escribe la respuesta pueden quedar marcas sin cerrar ("**" o un link): se
// muestra solo el texto, sin la sintaxis a medias
function hideOpenMarks(text) {
  let clean = text
  const openLink = clean.match(OPEN_LINK)
  if (openLink) clean = clean.slice(0, openLink.index) + openLink[1]
  const marks = clean.split('**').length - 1
  if (marks % 2 === 0) return clean
  const last = clean.lastIndexOf('**')
  return clean.slice(0, last) + clean.slice(last + 2)
}

function renderInline(text, onLinkClick) {
  return hideOpenMarks(text)
    .split(INLINE)
    .map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return <strong key={index}>{part.slice(2, -2)}</strong>
      }
      if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
        return (
          <code key={index} className="rich-text-code">
            {part.slice(1, -1)}
          </code>
        )
      }
      const link = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/)
      if (link) {
        const [, label, href] = link
        if (href.startsWith('/') && !href.startsWith('//')) {
          return (
            <Link key={index} to={href} className="rich-text-link" onClick={onLinkClick}>
              {label}
            </Link>
          )
        }
        if (href.startsWith('https://')) {
          return (
            <a key={index} href={href} className="rich-text-link" target="_blank" rel="noopener noreferrer">
              {label}
            </a>
          )
        }
        return label
      }
      return part
    })
}

function parseBlocks(text) {
  const blocks = []
  let list = null
  const closeList = () => {
    if (list) blocks.push(list)
    list = null
  }

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim()
    const bullet = line.match(/^[-*•]\s+(.*)$/)
    const numbered = line.match(/^\d+[.)]\s+(.*)$/)
    const heading = line.match(/^#{1,4}\s+(.*)$/)

    if (bullet || numbered) {
      const type = numbered ? 'ol' : 'ul'
      if (list?.type !== type) {
        closeList()
        list = { type, items: [] }
      }
      list.items.push((bullet ?? numbered)[1])
      continue
    }
    closeList()
    if (heading) blocks.push({ type: 'heading', text: heading[1] })
    else if (line) blocks.push({ type: 'p', text: line })
  }
  closeList()
  return blocks
}

/**
 * Texto con formato básico (el de las respuestas de Zoni). `onLinkClick` se llama al tocar un
 * link interno (ej. para cerrar el chat en el celular).
 */
function RichText({ text, onLinkClick, className = '' }) {
  return (
    <div className={`rich-text ${className}`.trim()}>
      {parseBlocks(text).map((block, index) => {
        if (block.type === 'heading') {
          return (
            <p key={index} className="rich-text-heading">
              {renderInline(block.text, onLinkClick)}
            </p>
          )
        }
        if (block.type === 'p') return <p key={index}>{renderInline(block.text, onLinkClick)}</p>
        const ListTag = block.type
        return (
          <ListTag key={index} className={`rich-text-list rich-text-list--${block.type}`}>
            {block.items.map((item, i) => (
              <li key={i}>{renderInline(item, onLinkClick)}</li>
            ))}
          </ListTag>
        )
      })}
    </div>
  )
}

export default RichText
