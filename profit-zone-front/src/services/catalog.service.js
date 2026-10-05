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
 * Encuesta de un rubro: preguntas generales (`business`) y específicas de la
 * subcategoría (`details`), ya ordenadas y con sus opciones activas.
 */
export async function fetchSubcategorySurvey(categoryCode, subcategoryCode) {
  const { data } = await api.get(
    `/categories/${categoryCode}/subcategories/${subcategoryCode}/questions`,
  )
  return data
}
