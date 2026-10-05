import Icon from '../../atoms/Icon/Icon.jsx'
import Input from '../../atoms/Input/Input.jsx'
import './AddressSearch.css'

/**
 * Buscador de direcciones: se busca al enviar (Enter o la lupa) y los resultados
 * se eligen de una lista. status: 'idle' | 'loading' | 'ok' | 'error'.
 */
function AddressSearch({ value, onChange, onSearch, onSelect, status, results, error }) {
  const handleSubmit = (event) => {
    event.preventDefault()
    if (value.trim()) onSearch(value.trim())
  }

  return (
    <form className="address-search" role="search" onSubmit={handleSubmit}>
      <label htmlFor="address-search-input" className="address-search-label">
        Buscar dirección
      </label>
      <div className="address-search-field">
        <Input
          id="address-search-input"
          type="search"
          className="address-search-input"
          placeholder="Ej.: Gurruchaga 1600"
          autoComplete="off"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <button type="submit" className="address-search-submit" aria-label="Buscar">
          <Icon name="search" size={16} />
        </button>
      </div>

      {status === 'loading' && <p className="address-search-message">Buscando…</p>}
      {status === 'error' && (
        <p className="address-search-message address-search-message--error" role="alert">
          {error}
        </p>
      )}
      {status === 'ok' && results.length === 0 && (
        <p className="address-search-message">No encontramos esa dirección en la Ciudad.</p>
      )}
      {status === 'ok' && results.length > 0 && (
        <ul className="address-search-results" aria-label="Resultados de la búsqueda">
          {results.map((result) => (
            <li key={`${result.lat},${result.lng}`}>
              <button type="button" className="address-search-result" onClick={() => onSelect(result)}>
                {result.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </form>
  )
}

export default AddressSearch
