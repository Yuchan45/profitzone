// `decimals: 0` para montos redondos (ej. alquileres)
export function formatCurrency(value, currency = 'ARS', { decimals } = {}) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function formatNumber(value) {
  return new Intl.NumberFormat('es-AR').format(value)
}

export function formatDate(value) {
  return new Intl.DateTimeFormat('es-AR').format(new Date(value))
}
