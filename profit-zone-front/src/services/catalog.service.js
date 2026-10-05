import api from './api.js'

/**
 * Categorías (rubros) con sus subcategorías.
 * `active` es opcional: true = solo activas, false = solo inactivas.
 */
export async function fetchCategories(active) {
  const { data } = await api.get('/categories', { params: { active } })
  return data
}

/**
 * Encuesta completa de un rubro: { category, subcategory, business[], details[] }.
 * Cada pregunta trae su scope (global, category, subcategory) y sus opciones activas.
 */
export async function fetchSubcategorySurvey(categoryCode, subcategoryCode) {
  const { data } = await api.get(
    `/categories/${encodeURIComponent(categoryCode)}/subcategories/${encodeURIComponent(subcategoryCode)}/questions`,
  )
  return data
}
