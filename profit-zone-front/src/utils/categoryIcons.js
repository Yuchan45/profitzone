// La API no trae íconos: se asignan por code de categoría.
const CATEGORY_ICONS = {
  gastronomia: 'store',
  fitness: 'dumbbell',
}
const DEFAULT_CATEGORY_ICON = 'store'

export function categoryIcon(categoryCode) {
  return CATEGORY_ICONS[categoryCode] ?? DEFAULT_CATEGORY_ICON
}
