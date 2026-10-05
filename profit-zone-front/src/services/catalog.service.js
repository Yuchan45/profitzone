import api from './api.js'

/**
 * Categorías (rubros) con sus subcategorías.
 * `active` es opcional: true = solo activas, false = solo inactivas.
 */
export async function fetchCategories(active) {
  const { data } = await api.get('/categories', { params: { active } })
  return data
}
