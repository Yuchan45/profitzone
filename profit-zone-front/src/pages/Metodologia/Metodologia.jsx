import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Icon from '../../components/atoms/Icon/Icon.jsx'
import './Metodologia.css'

// Datos del reporte: de dónde sale cada uno, cómo se calcula, cómo se lee y qué no dice.
// Los umbrales copian los de profit-zone-back (reportCriteria.service.js): si cambian allá,
// cambian acá.
const INDICATORS = [
  {
    id: 'competencia',
    title: 'Competencia',
    source: 'OpenStreetMap (todos los locales del radio) y Google Places (rating y reseñas de los más populares).',
    how: [
      'Contamos los locales del rubro que OpenStreetMap ubica dentro del radio y les sumamos los que solo aparecen en Google.',
      'Son competencia directa los de la cocina o el tipo que elegiste en el paso 2. El resto del rubro es competencia indirecta.',
      'La tabla hace una sola consulta a Google, que devuelve hasta 20 locales, los más populares. Con una cocina elegida pide solo esa cocina. Los directos que Google no trae y sí están en OpenStreetMap se suman sin rating.',
      'Orden "más fuertes primero": el rating de cada local se ajusta por su cantidad de reseñas, acercándolo al promedio de la zona cuando tiene pocas. Así un 4,9 con 8 reseñas no le gana a un 4,5 con 12.000.',
    ],
    rule: 'Debilidad con 6 directos o más, o con 3 o más y rating promedio de 4,4 o más. Alerta con 3 a 5 directos. Fortaleza con menos de 3.',
    limits: 'OpenStreetMap no tiene la cocina de todos los locales (en Palermo, cerca del 40% de los restaurantes la tiene): puede haber directos contados como indirectos. Por los términos de Google, sus locales no se muestran en nuestro mapa.',
  },
  {
    id: 'afluencia',
    title: 'Afluencia típica del rubro',
    source: 'Perfil horario típico de cada rubro en CABA (estimado).',
    how: [
      'Cada rubro tiene una curva de actividad de 7 a 23 h, de 0 a 100, donde 100 es la hora pico del día.',
      'El puntaje es el promedio de la curva en las horas de tu franja.',
    ],
    rule: 'Fortaleza desde 65. Neutral de 40 a 64. Alerta por debajo de 40.',
    limits: 'No se mide en el punto elegido: es igual en cualquier lugar de Palermo. Sirve para ver si tu horario coincide con las horas fuertes del rubro, no para comparar esquinas.',
  },
  {
    id: 'poblacion',
    title: 'Población',
    source: 'Censo Nacional 2022 (INDEC), por radio censal, con su estructura por edad y sexo.',
    how: [
      'Sumamos la población de los radios censales que tocan el círculo, cada uno en proporción a la parte de su superficie que queda adentro.',
      'La densidad es esa población dividida por la superficie del círculo.',
    ],
    rule: 'Público: fortaleza si en el radio viven 1.500 personas o más de tu rango de edad y su proporción llega al 95% de la de CABA. Debilidad con menos de 500 o menos del 75% de la proporción de CABA. Si no, alerta. Cómo llega el cliente (si es de paso): fortaleza desde 10.000 hab/km², debilidad por debajo de 4.000, alerta en el medio.',
    limits: 'El reparto por superficie supone que la gente vive pareja dentro de cada radio censal. Cuenta a quienes viven ahí, no a quienes trabajan o pasan.',
  },
  {
    id: 'alquiler',
    title: 'Alquiler comercial',
    source: 'Avisos de locales comerciales en alquiler publicados en ZonaProp.',
    how: [
      'Tomamos la mediana del precio mensual de los avisos dentro del radio: la mitad pide menos y la mitad más. La mediana no se mueve por un aviso carísimo o regalado.',
      'Los avisos publicados en dólares se pasan a pesos con el dólar oficial.',
    ],
    rule: 'Fortaleza si la mediana entra en tu presupuesto. Alerta si lo supera hasta un 25%. Debilidad si lo supera por más.',
    limits: 'Son precios pedidos, no cerrados. En el mapa solo se ven los avisos que publican la dirección exacta.',
  },
  {
    id: 'accesibilidad',
    title: 'Accesibilidad y transporte',
    source: 'Paradas de colectivo y estaciones de subte y tren de OpenStreetMap, con las líneas de sus recorridos.',
    how: [
      'Contamos las paradas y estaciones dentro del radio. Cada una cuenta una vez aunque OpenStreetMap tenga un punto por vereda o por andén.',
      'Las líneas de colectivo salen de los recorridos que pasan por cada parada (los ramales cuentan como su línea: el 39-3 es el 39).',
    ],
    rule: 'Fortaleza con una estación de subte o tren, o con 6 paradas o más. Alerta con 2 a 5 paradas. Debilidad con menos de 2.',
    limits: 'Algunas paradas no tienen sus líneas cargadas en OpenStreetMap: se cuentan igual y figuran sin líneas.',
  },
]

function Metodologia() {
  const { hash } = useLocation()

  // Al llegar desde "Ver la metodología completa" de una tarjeta, va a su sección
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView()
  }, [hash])

  return (
    <div className="metodologia">
      <header className="metodologia-header">
        <Link to="/" className="metodologia-back">
          <Icon name="arrow-left" size={16} />
          Volver al inicio
        </Link>
        <h1 className="metodologia-title">Cómo calculamos cada dato</h1>
        <p className="metodologia-lede">
          De dónde sale cada número del reporte, cómo lo calculamos, cuándo lo marcamos como fortaleza o
          debilidad y qué no dice. El reporte describe la zona: no indica si conviene o no abrir.
        </p>
        <nav className="metodologia-index" aria-label="Secciones">
          <a href="#comparacion">Comparado con Palermo</a>
          {INDICATORS.map((indicator) => (
            <a key={indicator.id} href={`#${indicator.id}`}>
              {indicator.title}
            </a>
          ))}
        </nav>
      </header>

      <section id="comparacion" className="metodologia-section metodologia-section--featured">
        <h2 className="metodologia-section-title">Comparado con Palermo</h2>
        <p className="metodologia-text">
          Un número solo no dice si es mucho o poco. Por eso cada dato se compara con el resto del barrio: medimos
          lo mismo, con el mismo radio y el mismo método, desde el centro de cada uno de los 295 radios censales de
          Palermo. Los radios censales son más chicos donde vive más gente, así los Bosques y el Aeroparque casi no
          pesan en la comparación.
        </p>
        <ul className="metodologia-list">
          <li>
            <strong>Mediana de Palermo:</strong> el valor del medio. La mitad de los puntos del barrio tiene menos y
            la mitad más.
          </li>
          <li>
            <strong>"Más que el 80% de Palermo":</strong> el punto elegido supera a 8 de cada 10 puntos del barrio.
            Entre el 25% y el 75% lo consideramos en la media.
          </li>
          <li>
            La competencia se compara con los locales de OpenStreetMap (igual en el punto y en el barrio), así que
            el número de la comparación puede ser un poco menor que el total de la tarjeta, que suma los de Google.
          </li>
          <li>
            La densidad de población se compara con el promedio del barrio (habitantes sobre superficie), sin
            percentil. La afluencia no se compara: es la misma en todo el barrio.
          </li>
        </ul>
      </section>

      {INDICATORS.map((indicator) => (
        <section key={indicator.id} id={indicator.id} className="metodologia-section">
          <h2 className="metodologia-section-title">{indicator.title}</h2>
          <dl className="metodologia-facts">
            <div className="metodologia-fact">
              <dt>De dónde sale</dt>
              <dd>{indicator.source}</dd>
            </div>
            <div className="metodologia-fact">
              <dt>Cómo se calcula</dt>
              <dd>
                <ul className="metodologia-list">
                  {indicator.how.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
              </dd>
            </div>
            <div className="metodologia-fact">
              <dt>En fortalezas y debilidades</dt>
              <dd>{indicator.rule}</dd>
            </div>
            <div className="metodologia-fact">
              <dt>Qué no dice</dt>
              <dd>{indicator.limits}</dd>
            </div>
          </dl>
        </section>
      ))}

      <p className="metodologia-footer">
        Los umbrales son una primera propuesta y se van a ajustar con el uso. Más sobre el alcance del servicio en
        los <Link to="/terminos">términos</Link>.
      </p>
    </div>
  )
}

export default Metodologia
