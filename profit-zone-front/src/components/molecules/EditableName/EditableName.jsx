import { useEffect, useRef, useState } from 'react'
import Input from '../../atoms/Input/Input.jsx'
import IconButton from '../../atoms/IconButton/IconButton.jsx'
import './EditableName.css'

/**
 * Nombre con un lápiz al lado para editarlo en el lugar. Al tocar el lápiz, el nombre
 * pasa a un campo con Guardar y Cancelar (Enter guarda, Escape cancela).
 * - `value`: nombre actual (null: se muestra `placeholder`, ej. el rubro). Guardarlo vacío
 *   vuelve al placeholder.
 * - `as` / `textClassName`: etiqueta y clase del texto (ej. h1 en el detalle del reporte).
 * - `onSave(name)`: devuelve true si se guardó; si no, el campo queda abierto con `error`.
 * - `onCancel`: avisa que se cerró sin guardar (para descartar el error).
 */
function EditableName({
  value,
  placeholder,
  as: Tag = 'span',
  textClassName = '',
  maxLength,
  saving = false,
  error,
  onSave,
  onCancel,
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef(null)

  // Al abrir el campo, el foco va ahí con el texto seleccionado para escribir encima
  useEffect(() => {
    if (!editing) return
    inputRef.current.focus()
    inputRef.current.select()
  }, [editing])

  // El campo arranca con el nombre que se está viendo (sin nombre propio, el placeholder)
  const startEditing = () => {
    setDraft(value ?? placeholder ?? '')
    setEditing(true)
  }

  const cancel = () => {
    setEditing(false)
    onCancel?.()
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const name = draft.trim()
    // Sin cambios no se guarda: tampoco se guarda el placeholder como si fuera un nombre
    if (name === (value ?? placeholder ?? '')) {
      cancel()
      return
    }
    if (await onSave(name)) setEditing(false)
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      cancel()
    }
  }

  if (!editing) {
    return (
      <span className="editable-name">
        <Tag className={textClassName}>{value ?? placeholder}</Tag>
        <IconButton icon="pencil" label="Editar nombre" onClick={startEditing} />
      </span>
    )
  }

  return (
    <form className="editable-name editable-name-form" onSubmit={handleSubmit} noValidate>
      <span className="editable-name-row">
        <Input
          ref={inputRef}
          className="editable-name-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          maxLength={maxLength}
          aria-label="Nombre"
          invalid={Boolean(error)}
          disabled={saving}
        />
        <IconButton
          icon="check"
          label="Guardar"
          type="submit"
          className="editable-name-save"
          disabled={saving}
        />
        <IconButton icon="x" label="Cancelar" onClick={cancel} disabled={saving} />
      </span>
      {error && (
        <span className="editable-name-error" role="alert">
          {error}
        </span>
      )}
    </form>
  )
}

export default EditableName
