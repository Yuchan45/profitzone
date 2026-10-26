// Guía de trámites y habilitaciones para abrir un local en la Ciudad de Buenos Aires
// (PZ-61). Contenido orientativo y estático: no sale de la API porque no depende de la
// zona, solo del rubro. Los códigos de rubro son los del catálogo
// (profit-zone-back/src/db/seeders/data/catalog.js).
//
// Cada punto: { id, title, text, issuer | rule, url }. `issuer` es dónde se gestiona
// (se muestra "Lo gestionás en"); `rule` es la norma que lo exige ("Lo exige"). Solo
// se cargan requisitos verificados en fuentes oficiales; al cambiar el contenido,
// actualizar PERMITS_REVIEWED_AT.

export const PERMITS_REVIEWED_AT = 'octubre de 2026'

// Rubros con guía, en el orden en que se muestran en /tramites
export const PERMITS_RUBROS = [
  {
    code: 'gastronomia',
    name: 'Gastronomía',
    subcategories: [
      { code: 'restaurante', name: 'Restaurante', article: 'un' },
      { code: 'cafeteria', name: 'Cafetería', article: 'una' },
    ],
  },
  {
    code: 'fitness',
    name: 'Fitness y bienestar',
    subcategories: [
      { code: 'gimnasio', name: 'Gimnasio', article: 'un' },
      { code: 'pilates', name: 'Estudio de pilates', article: 'un' },
    ],
  },
]

const URL = {
  ciudad3d: 'https://ciudad3d.buenosaires.gob.ar',
  monotributo: 'https://www.argentina.gob.ar/servicio/inscribirme-como-monotributista',
  monotributoUnificado: 'https://servicioscf.afip.gob.ar/publico/sitio/contenido/novedad/ver.aspx?id=5457',
  habilitacion: 'https://buenosaires.gob.ar/tramites/habilitacion-de-actividad-economica',
  autoproteccion: 'https://static.buenosaires.gob.ar/sites/default/files/2025-05/ley%205920%20actualizada%202025.pdf',
  carteleria: 'https://buenosaires.gob.ar/gcaba_historico/carteleria-obligatoria',
  letrero: 'https://buenosaires.gob.ar/tramites/solicitud-de-permiso-de-anuncio-publicitario-exterior',
  manipulador: 'https://buenosaires.gob.ar/tramites/inscripcion-al-curso-de-manipulacion-de-alimentos',
  aptitudAmbiental: 'https://buenosaires.gob.ar/tramites/impacto-ambiental-certificado-de-aptitud-ambiental-caa',
  vereda: 'https://buenosaires.gob.ar/tramites/solicitud-de-permiso-de-area-gastronomica',
  ley139:
    'https://digesto.buenosaires.gob.ar/documento/download/Ley%20Ciudad-139__52dd1b98aa5931c5a8ac0609d05a2b49176a1894.pdf',
  decreto11_22: 'https://documentosboletinoficial.buenosaires.gob.ar/publico/PE-DEC-AJG-AJG-11-22-ANX.pdf',
}

const COMMON = [
  {
    id: 'uso',
    title: 'Que tu actividad esté permitida en esa dirección',
    text: 'El Código Urbanístico define qué usos se admiten en cada parcela. Hacé una primera consulta en Ciudad 3D; para confirmarlo, un profesional puede pedir el Informe Urbanístico.',
    issuer: 'Gobierno de la Ciudad',
    url: URL.ciudad3d,
  },
  {
    id: 'contrato',
    title: 'Contrato de alquiler y reglamento del edificio',
    text: 'Al habilitar vas a declarar que tenés derecho a usar el local y que el reglamento de copropiedad no prohíbe tu actividad. Revisá las dos cosas antes de firmar.',
    rule: 'Habilitación de la AGC (declaración jurada)',
    url: null,
  },
  {
    id: 'arca',
    title: 'CUIT e inscripción impositiva',
    text: 'Necesitás CUIT y clave fiscal nivel 3 para facturar. Para un emprendimiento chico lo habitual es el monotributo, que tiene topes de facturación y también de superficie del local, consumo de energía y alquiler.',
    issuer: 'ARCA (ex AFIP)',
    url: URL.monotributo,
  },
  {
    id: 'ingresos-brutos',
    title: 'Ingresos Brutos',
    text: 'Desde enero de 2026 el monotributo incluye el Ingresos Brutos de la Ciudad: se paga en una sola boleta y el alta se hace en ARCA. Si no sos monotributista, te inscribís en AGIP en el régimen general.',
    issuer: 'ARCA y AGIP',
    url: URL.monotributoUnificado,
  },
  {
    id: 'habilitacion',
    title: 'Habilitación del local',
    text: 'Se tramita online y es gratuita. Hasta 200 m² puede corresponder la habilitación exprés, sin profesional; si no, va con una declaración responsable firmada por un profesional (con plano desde 500 m²) o con inspección previa. El sistema te indica cuál corresponde a tu actividad.',
    issuer: 'Agencia Gubernamental de Control (AGC)',
    url: URL.habilitacion,
  },
  {
    id: 'autoproteccion',
    title: 'Plan de Autoprotección y matafuegos',
    text: 'Es el plan de evacuación y emergencias del local. Por debajo de 500 m² alcanza con una declaración jurada; desde 500 m², o en galerías y shoppings, hay que aprobar el plan completo. Se renueva cada 2 años. Además, el local necesita matafuegos con la carga al día.',
    issuer: 'Defensa Civil de la Ciudad',
    url: URL.autoproteccion,
  },
  {
    id: 'carteleria',
    title: 'Carteles obligatorios para el consumidor',
    text: 'Tenés que exhibir, entre otros, los carteles de precios, de reclamos, de cambios y devoluciones y del libro de quejas.',
    rule: 'Leyes de Defensa al Consumidor de la Ciudad',
    url: URL.carteleria,
  },
  {
    id: 'letrero',
    title: 'Permiso para el letrero del frente',
    text: 'Los carteles frontales, salientes o luminosos necesitan su propio permiso, con plano firmado por un profesional y seguro de responsabilidad civil. Es gratuito.',
    issuer: 'Agencia Gubernamental de Control (AGC)',
    url: URL.letrero,
  },
  {
    id: 'musica',
    title: 'Música en el local',
    text: 'Si pasás música, tenés que pagar la licencia de derechos de autores e intérpretes (por ejemplo, SADAIC y AADI-CAPIF). Una cuenta personal de streaming no alcanza.',
    issuer: 'Entidades de gestión de derechos de autor',
    url: null,
  },
]

const BY_CATEGORY = {
  gastronomia: {
    title: 'Gastronomía',
    intro: 'Además de la habilitación, un local de comida suma estos requisitos.',
    items: [
      {
        id: 'manipulador',
        title: 'Carnet de manipulador de alimentos',
        text: 'Lo necesita cada persona que manipula alimentos. El curso es gratuito (presencial u online), el examen es presencial y el carnet dura 3 años.',
        issuer: 'Agencia Gubernamental de Control (AGC)',
        url: URL.manipulador,
      },
      {
        id: 'aptitud-ambiental',
        title: 'Certificado de Aptitud Ambiental',
        text: 'Se pide antes de la habilitación y es gratuito. Si la actividad no tiene un impacto ambiental relevante sale en el momento; si no, lo gestiona un profesional.',
        issuer: 'Agencia de Protección Ambiental (APRA)',
        url: URL.aptitudAmbiental,
      },
      {
        id: 'vereda',
        title: 'Mesas y sillas en la vereda',
        text: 'Es un permiso aparte, gratuito, que dura 5 años. La vereda tiene que medir más de 2,5 m, hay que dejar libre el paso peatonal y se pide seguro de responsabilidad civil.',
        issuer: 'Gobierno de la Ciudad (uso del espacio público)',
        url: URL.vereda,
      },
    ],
  },
  fitness: {
    title: 'Fitness y bienestar',
    intro:
      'Los gimnasios tienen una ley propia en la Ciudad (Ley 139). Un estudio de pilates entra en su definición: un local para practicar actividad física no competitiva.',
    items: [
      {
        id: 'profesor',
        title: 'Profesor/a de Educación Física a cargo',
        text: 'Las clases tienen que estar supervisadas por un profesor/a con título reconocido en la Ciudad, y al menos uno tiene que estar presente mientras el local está abierto. Tené una copia del título en el local.',
        rule: 'Ley 139 y Decreto 11/22',
        url: URL.decreto11_22,
      },
      {
        id: 'autorreporte',
        title: 'Autorreporte de salud de cada alumno',
        text: 'Quien entrena presenta una declaración jurada de salud basada en un examen médico de menos de un año. Si tiene alguna condición que pueda ser incompatible con la actividad, suma un certificado médico.',
        rule: 'Decreto 11/22 (reglamenta la Ley 139)',
        url: URL.decreto11_22,
      },
      {
        id: 'emergencias',
        title: 'Emergencias médicas, RCP y botiquín',
        text: 'Tenés que estar adherido a un servicio de emergencias médicas (y mostrar el comprobante si te lo piden), capacitar a los profesores en RCP y primeros auxilios y tener un botiquín con los elementos que fija la reglamentación.',
        rule: 'Ley 139 y Decreto 11/22',
        url: URL.ley139,
      },
      {
        id: 'sustancias',
        title: 'Sin venta de sustancias para el rendimiento',
        text: 'Está prohibido vender o entregar medicamentos, drogas o sustancias que modifiquen el rendimiento físico.',
        rule: 'Ley 139, artículo 8',
        url: URL.ley139,
      },
    ],
  },
}

// Puntos que solo aplican a una subcategoría (se suman a los del rubro). Vacío por
// ahora: no hay requisitos verificados que distingan restaurante de cafetería, ni
// gimnasio de pilates.
const BY_SUBCATEGORY = {}

// Notas según la respuesta a "¿Cómo vas a atender al público?"
const BY_SERVICE_MODE = {
  gallery: {
    title: 'Si el local está en una galería o shopping',
    items: [
      {
        id: 'galeria-habilitacion',
        title: 'No aplica la habilitación exprés',
        text: 'Aunque el local sea chico, va por el trámite con profesional, indicando el número de local o unidad funcional.',
        issuer: 'Agencia Gubernamental de Control (AGC)',
        url: URL.habilitacion,
      },
      {
        id: 'galeria-autoproteccion',
        title: 'Plan de Autoprotección completo',
        text: 'En galerías y shoppings hay que aprobar el plan completo aunque el local tenga menos de 500 m².',
        issuer: 'Defensa Civil de la Ciudad',
        url: URL.autoproteccion,
      },
    ],
  },
  no_public: {
    title: 'Sin atención al público',
    items: [
      {
        id: 'sin-publico-habilitacion',
        title: 'La habilitación sigue siendo necesaria',
        text: 'Aunque no atiendas al público, toda actividad económica en un local necesita su habilitación.',
        issuer: 'Agencia Gubernamental de Control (AGC)',
        url: URL.habilitacion,
      },
    ],
  },
}

/**
 * Arma la guía de un rubro: { name, article, sections: [{ id, title, intro, items, open }] }.
 * Devuelve null si el rubro no tiene guía. Una subcategoría sin datos propios usa
 * los del rubro. Lo propio del rubro y las notas por modo de atención van abiertos;
 * lo común a cualquier local, cerrado.
 */
export function getPermitsGuide({ categoryCode, subcategoryCode, serviceMode = null }) {
  const category = PERMITS_RUBROS.find((rubro) => rubro.code === categoryCode)
  const specific = BY_CATEGORY[categoryCode]
  if (!category || !specific) return null

  const subcategory = category.subcategories.find((sub) => sub.code === subcategoryCode)
  const name = subcategory?.name ?? category.name
  const article = subcategory?.article ?? 'un negocio de'

  const sections = [
    {
      id: categoryCode,
      title: specific.title,
      intro: specific.intro,
      items: [...specific.items, ...(BY_SUBCATEGORY[subcategoryCode] ?? [])],
      open: true,
    },
  ]

  const modeNotes = BY_SERVICE_MODE[serviceMode]
  if (modeNotes) sections.push({ id: `mode-${serviceMode}`, ...modeNotes, open: true })

  sections.push({
    id: 'common',
    title: 'Para cualquier local',
    intro: 'Inscripciones y habilitación que necesita todo comercio en la Ciudad.',
    items: COMMON,
    open: false,
  })

  return { name, article, sections: sections.filter((section) => section.items.length > 0) }
}
