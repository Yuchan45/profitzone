import { Category, Subcategory, SubcategorySearchTerm } from '../models/index.js'

/**
 * Arma la consulta de categorías con sus subcategorías y términos de búsqueda.
 * Con `active` definido filtra categorías y subcategorías por is_active
 * (la subcategoría con required: false, para no perder categorías vacías).
 */
function buildCategoryQuery({ where = {}, active } = {}) {
  const activeWhere = active === undefined ? {} : { isActive: active }

  return {
    where: { ...where, ...activeWhere },
    include: [
      {
        model: Subcategory,
        as: 'subcategories',
        required: false,
        where: active === undefined ? undefined : activeWhere,
        include: [{ model: SubcategorySearchTerm, as: 'searchTerms', required: false }],
      },
    ],
    order: [
      ['sortOrder', 'ASC'],
      [{ model: Subcategory, as: 'subcategories' }, 'sortOrder', 'ASC'],
      [{ model: Subcategory, as: 'subcategories' }, { model: SubcategorySearchTerm, as: 'searchTerms' }, 'isPrimary', 'DESC'],
      [{ model: Subcategory, as: 'subcategories' }, { model: SubcategorySearchTerm, as: 'searchTerms' }, 'termValue', 'ASC'],
    ],
  }
}

function toSubcategoryDto(subcategory) {
  return {
    code: subcategory.code,
    name: subcategory.name,
    description: subcategory.description,
    sortOrder: subcategory.sortOrder,
    isActive: subcategory.isActive,
    searchTerms: subcategory.searchTerms.map((term) => ({
      termType: term.termType,
      termValue: term.termValue,
      isPrimary: term.isPrimary,
    })),
  }
}

function toCategoryDto(category) {
  return {
    code: category.code,
    name: category.name,
    description: category.description,
    sortOrder: category.sortOrder,
    isActive: category.isActive,
    subcategoryCount: category.subcategories.length,
    subcategories: category.subcategories.map(toSubcategoryDto),
  }
}

/** Lista las categorías (rubros) con sus subcategorías, ordenadas por sortOrder. */
export async function listCategories({ active } = {}) {
  const categories = await Category.findAll(buildCategoryQuery({ active }))
  return categories.map(toCategoryDto)
}

/** Devuelve una categoría por su code. Lanza 404 si no existe. */
export async function getCategoryByCode(code, { active } = {}) {
  const category = await Category.findOne(buildCategoryQuery({ where: { code }, active }))

  if (!category) {
    const error = new Error(`No existe la categoría "${code}".`)
    error.status = 404
    throw error
  }

  return toCategoryDto(category)
}
