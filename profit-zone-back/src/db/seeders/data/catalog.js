// Datos base del catálogo de configuración (PZ-6). Solo contenido: la lógica
// está en ../catalog.js. Cada fila se identifica por su clave natural (code,
// name en roles, combinaciones únicas), nunca por id.
//
// Para cambiar un texto, editarlo acá y volver a correr `npm run db:seed:catalog`:
// se actualiza la fila existente. Quitar algo de este archivo NO lo borra de la
// DB (el catálogo usado se desactiva con is_active = 0, no se elimina).

export const roles = [
  { name: 'admin', description: 'Administración', isDefault: false },
  { name: 'free', description: 'Plan gratuito', isDefault: true },
  { name: 'premium', description: 'Plan premium', isDefault: false },
]

// Categorías → subcategorías → términos de búsqueda en Google Places.
export const categories = [
  {
    code: 'gastronomia',
    name: 'Gastronomía',
    description: 'Restaurantes y cafeterías.',
    sortOrder: 1,
    subcategories: [
      {
        code: 'restaurante',
        name: 'Restaurante',
        sortOrder: 1,
        searchTerms: [{ termType: 'type', termValue: 'restaurant', isPrimary: true }],
      },
      {
        code: 'cafeteria',
        name: 'Cafetería',
        sortOrder: 2,
        searchTerms: [{ termType: 'type', termValue: 'cafe', isPrimary: true }],
      },
    ],
  },
  {
    code: 'fitness',
    name: 'Fitness y bienestar',
    description: 'Gimnasios y estudios de pilates.',
    sortOrder: 2,
    subcategories: [
      {
        code: 'gimnasio',
        name: 'Gimnasio tradicional',
        sortOrder: 1,
        searchTerms: [
          { termType: 'type', termValue: 'gym', isPrimary: true },
          { termType: 'type', termValue: 'fitness_center' },
        ],
      },
      {
        code: 'pilates',
        name: 'Pilates',
        sortOrder: 2,
        searchTerms: [{ termType: 'keyword', termValue: 'pilates', isPrimary: true }],
      },
    ],
  },
]

// Atajos para las asignaciones. Todas son obligatorias (is_required = 1).
// En scope 'subcategory' la categoría solo se usa para encontrar la
// subcategoría (su code es único dentro de la categoría); category_id queda NULL.
const global = (section, sortOrder) => ({ scope: 'global', section, sortOrder })
const sub = (category, subcategory, section, sortOrder) => ({
  scope: 'subcategory',
  category,
  subcategory,
  section,
  sortOrder,
})

// Las opciones toman sort_order según su posición (1..n).
export const questions = [
  {
    code: 'service_mode',
    prompt: '¿Cómo vas a atender al público?',
    inputType: 'single_choice',
    assignments: [global('business', 1)],
    options: [
      { code: 'street', label: 'Local a la calle' },
      { code: 'gallery', label: 'En galería / shopping' },
      {
        code: 'no_public',
        label: 'Sin atención al público',
        // hideQuestions: preguntas que dependen del público que pasa. No se muestran
        // ni son obligatorias si se elige esta opción.
        metadata: {
          hideIndicators: ['competition', 'traffic'],
          hideQuestions: ['schedule', 'arrival_type', 'peak_slot_cafe', 'peak_slot_fitness'],
        },
      },
    ],
  },
  {
    code: 'target_age',
    prompt: '¿A qué público apuntás?',
    helpText: 'Podés elegir más de uno.',
    inputType: 'multi_choice',
    assignments: [global('business', 2)],
    options: [
      { code: 'kids', label: 'Familias / niños (0–14)', valueMin: 0, valueMax: 14 },
      { code: 'young', label: 'Jóvenes (15–34)', valueMin: 15, valueMax: 34 },
      { code: 'adults', label: 'Adultos (35–59)', valueMin: 35, valueMax: 59 },
      { code: 'seniors', label: 'Adultos mayores (60+)', valueMin: 60, valueMax: null },
    ],
  },
  {
    code: 'schedule',
    prompt: '¿En qué horario vas a trabajar más?',
    inputType: 'single_choice',
    assignments: [global('business', 3)],
    options: [
      { code: 'day', label: 'Diurno (8 a 20 h)', metadata: { hours: [8, 20] } },
      { code: 'night', label: 'Nocturno (20 a 2 h)', metadata: { hours: [20, 2] } },
      { code: 'both', label: 'Ambos' },
    ],
  },
  {
    code: 'arrival_type',
    prompt: '¿Cómo llega tu cliente?',
    inputType: 'single_choice',
    assignments: [global('business', 4)],
    options: [
      { code: 'destination', label: 'Va a propósito (destino)' },
      { code: 'walk_in', label: 'Depende del que pasa (de paso)' },
      { code: 'unknown', label: 'No estoy seguro', isUnknown: true },
    ],
  },
  {
    code: 'budget',
    prompt: '¿Cuánto podés pagar de alquiler por mes?',
    helpText: 'Montos de referencia, se actualizan por inflación.',
    inputType: 'single_choice',
    assignments: [global('business', 5)],
    options: [
      { code: 'up_to_500k', label: 'Hasta $500k', valueMin: 0, valueMax: 500000 },
      { code: '500k_1m', label: '$500k – $1M', valueMin: 500000, valueMax: 1000000 },
      { code: '1m_2m', label: '$1M – $2M', valueMin: 1000000, valueMax: 2000000 },
      { code: 'over_2m', label: 'Más de $2M', valueMin: 2000000, valueMax: null },
      { code: 'unknown', label: 'No lo tengo definido', isUnknown: true },
    ],
  },
  {
    code: 'cuisine_type',
    prompt: '¿Qué tipo de cocina?',
    inputType: 'single_choice',
    assignments: [sub('gastronomia', 'restaurante', 'details', 1)],
    options: [
      { code: 'italian', label: 'Italiana / pizzería' },
      { code: 'grill', label: 'Parrilla' },
      { code: 'asian', label: 'Asiática' },
      { code: 'international', label: 'Internacional / de autor' },
      { code: 'other', label: 'Otra' },
    ],
  },
  {
    code: 'service_channels',
    prompt: '¿Por qué canales vas a vender?',
    inputType: 'multi_choice',
    assignments: [sub('gastronomia', 'restaurante', 'details', 2)],
    options: [
      { code: 'dine_in', label: 'Salón' },
      { code: 'take_away', label: 'Take away' },
      { code: 'delivery', label: 'Delivery' },
    ],
  },
  {
    code: 'price_level',
    prompt: '¿Qué propuesta de precio tenés?',
    inputType: 'single_choice',
    assignments: [sub('gastronomia', 'restaurante', 'details', 3), sub('gastronomia', 'cafeteria', 'details', 3)],
    options: [
      { code: 'low', label: 'Económica' },
      { code: 'medium', label: 'Media' },
      { code: 'premium', label: 'Premium' },
    ],
  },
  {
    code: 'consumption_model',
    prompt: '¿Cómo se consume en tu cafetería?',
    inputType: 'single_choice',
    assignments: [sub('gastronomia', 'cafeteria', 'details', 1)],
    options: [
      { code: 'take_away', label: 'Take away / de paso' },
      { code: 'stay', label: 'Para quedarse (trabajar, estudiar, reunirse)' },
      { code: 'mixed', label: 'Mixto' },
    ],
  },
  {
    code: 'peak_slot_cafe',
    prompt: '¿Cuál es tu franja fuerte?',
    inputType: 'single_choice',
    assignments: [sub('gastronomia', 'cafeteria', 'details', 2)],
    options: [
      { code: 'morning', label: 'Mañana / desayuno' },
      { code: 'afternoon', label: 'Tarde / merienda' },
      { code: 'all_day', label: 'Todo el día' },
    ],
  },
  {
    code: 'offer_type_gym',
    prompt: '¿Qué tipo de oferta vas a tener?',
    inputType: 'single_choice',
    assignments: [sub('fitness', 'gimnasio', 'details', 1)],
    options: [
      { code: 'weights_cardio', label: 'Musculación y cardio' },
      { code: 'group_classes', label: 'Clases grupales / funcional' },
      { code: 'mixed', label: 'Mixto' },
    ],
  },
  {
    code: 'surface_gym',
    prompt: '¿Qué superficie necesitás?',
    inputType: 'single_choice',
    assignments: [sub('fitness', 'gimnasio', 'details', 2)],
    options: [
      { code: 'up_to_200', label: 'Hasta 200 m²', valueMin: 0, valueMax: 200 },
      { code: '200_500', label: '200–500 m²', valueMin: 200, valueMax: 500 },
      { code: 'over_500', label: 'Más de 500 m²', valueMin: 500, valueMax: null },
    ],
  },
  {
    code: 'peak_slot_fitness',
    prompt: '¿Cuál es tu franja pico esperada?',
    inputType: 'single_choice',
    assignments: [sub('fitness', 'gimnasio', 'details', 3), sub('fitness', 'pilates', 'details', 3)],
    options: [
      { code: 'morning', label: 'Mañana' },
      { code: 'midday', label: 'Mediodía' },
      { code: 'evening', label: 'Tarde-noche' },
    ],
  },
  {
    code: 'format_pilates',
    prompt: '¿Qué formato de clases?',
    inputType: 'single_choice',
    assignments: [sub('fitness', 'pilates', 'details', 1)],
    options: [
      { code: 'reformer', label: 'Reformer / equipos' },
      { code: 'mat', label: 'Mat / grupos' },
      { code: 'both', label: 'Ambos' },
    ],
  },
  {
    code: 'surface_pilates',
    prompt: '¿Qué superficie necesitás?',
    inputType: 'single_choice',
    assignments: [sub('fitness', 'pilates', 'details', 2)],
    options: [
      { code: 'up_to_80', label: 'Hasta 80 m²', valueMin: 0, valueMax: 80 },
      { code: '80_200', label: '80–200 m²', valueMin: 80, valueMax: 200 },
      { code: 'over_200', label: 'Más de 200 m²', valueMin: 200, valueMax: null },
    ],
  },
]
