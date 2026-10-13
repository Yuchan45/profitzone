import { Link } from 'react-router-dom'
import Icon from '../../components/atoms/Icon/Icon.jsx'
import './Terminos.css'

function Terminos() {
  return (
    <div className="terminos-container">
      <header className="terminos-header">
        <Link to="/" className="terminos-back-link">
          <Icon name="arrow-left" size={16} />
          Volver al inicio
        </Link>
        <h1 className="terminos-title">Términos de Servicio y Descargo de Responsabilidad</h1>
        <p className="terminos-updated">Última actualización: Octubre de 2026</p>
      </header>

      <section className="terminos-highlight-box" aria-labelledby="descargo-principal-title">
        <div className="terminos-highlight-box__header">
          <Icon name="shield-alert" size={24} className="terminos-highlight-box__icon" />
          <h2 id="descargo-principal-title" className="terminos-highlight-box__title">
            Aviso de Exclusión de Garantías de Éxito Comercial
          </h2>
        </div>
        <p className="terminos-highlight-box__text">
          ProfitZone es una herramienta de agregación de datos e inteligencia geoespacial para fines estrictamente
          orientativos. <strong>Bajo ninguna circunstancia ProfitZone garantiza ni asegura el éxito comercial,
          el flujo de ventas, la afluencia efectiva de público ni la rentabilidad económica</strong> de la apertura,
          traslado o inversión en un local comercial. La decisión final y la asunción integral del riesgo comercial
          corresponden con exclusividad al usuario.
        </p>
      </section>

      <div className="terminos-sections">
        <article className="terminos-section">
          <h2 className="terminos-section__title">1. Naturaleza y propósito del servicio</h2>
          <p className="terminos-section__text">
            ProfitZone provee visualizaciones, métricas estimadas y análisis exploratorios sobre radios geográficos
            determinados a partir de información disponible. La información provista tiene carácter referencial y
            no sustituye los estudios de mercado presenciales, auditorías financieras, análisis de modelo de negocio
            ni el asesoramiento legal y contable profesional.
          </p>
        </article>

        <article className="terminos-section">
          <h2 className="terminos-section__title">2. Factores fuera del alcance de la plataforma</h2>
          <p className="terminos-section__text">
            El éxito o fracaso de cualquier emprendimiento o sucursal comercial depende de múltiples variables
            exógenas y operativas no susceptibles de previsión mediante analítica espacial, tales como:
          </p>
          <ul className="terminos-list">
            <li>Calidad, propuesta de valor, fijación de precios y competitividad del producto o servicio.</li>
            <li>Capacidad de gestión, atención al cliente y habilidades del personal operativo.</li>
            <li>Presupuesto, ejecución de estrategias de marketing y captación comercial.</li>
            <li>Disponibilidad de capital de trabajo, estructura de costos fijos y obligaciones financieras.</li>
            <li>Condiciones macroeconómicas, normativas municipales, tributarias y cambios regulatorios.</li>
          </ul>
        </article>

        <article className="terminos-section">
          <h2 className="terminos-section__title">3. Fuentes de datos y margen de error</h2>
          <p className="terminos-section__text">
            Las estimaciones demográficas, afluencia horaria, competencia y valores de alquiler se construyen a partir
            de fuentes públicas, censales, colaborativas y de terceros (incluyendo INDEC, OpenStreetMap, Google Places y
            portales de avisos inmobiliarios). ProfitZone no tiene control ni asume responsabilidad por la eventual
            inexactitud, desactualización o intermitencia de las bases de datos de dichos proveedores.
          </p>
        </article>

        <article className="terminos-section">
          <h2 className="terminos-section__title">4. Limitación de responsabilidad e indemnidad</h2>
          <p className="terminos-section__text">
            En la máxima medida autorizada por la legislación aplicable, ProfitZone, sus creadores y colaboradores
            quedan exentos de cualquier responsabilidad civil, comercial o contractual por perjuicios directos o
            indirectos, pérdidas comerciales, lucro cesante o daños derivados del uso o de decisiones tomadas en base a
            los reportes emitidos por el sistema.
          </p>
        </article>
      </div>

      <footer className="terminos-footer">
        <p className="terminos-footer__text">
          Si tenés dudas acerca del alcance legal de nuestros análisis, comunicate con nuestro equipo a través de los
          canales de contacto de la plataforma.
        </p>
      </footer>
    </div>
  )
}

export default Terminos

