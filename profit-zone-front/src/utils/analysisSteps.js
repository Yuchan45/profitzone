// Pasos del wizard de análisis, en orden. El Stepper los numera desde 1.
export const ANALYSIS_STEPS = ['Rubro', 'Tu negocio', 'Ubicación', 'Análisis', 'Reporte']

// Rutas del wizard. "detalles" es el paso 2b: comparte el número de paso con "negocio".
export const ANALYSIS_PATHS = {
  rubro: '/analizar/rubro',
  negocio: '/analizar/negocio',
  detalles: '/analizar/detalles',
  ubicacion: '/analizar/ubicacion',
}
