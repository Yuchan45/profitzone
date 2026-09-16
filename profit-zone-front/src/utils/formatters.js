export function formatCurrency(value, currency = 'ARS') {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(value)
}

export function formatDate(value) {
  return new Intl.DateTimeFormat('es-AR').format(new Date(value))
}
