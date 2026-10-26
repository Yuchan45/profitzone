/** Mediana de una lista de números (con cantidad par, el promedio redondeado de los dos del medio). 0 si está vacía. */
export function calculateMedian(numbers) {
  if (!numbers || numbers.length === 0) return 0
  const sorted = [...numbers].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2)
}
