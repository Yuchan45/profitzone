import { Link } from 'react-router-dom'
import InfoPage from '../../components/organisms/InfoPage/InfoPage.jsx'

function SobreNosotros() {
  return (
    <InfoPage
      title="Sobre nosotros"
      lede="ProfitZone ayuda a evaluar la ubicación de un local antes de abrirlo, con datos abiertos y verificables."
    >
      <InfoPage.Section title="Qué hacemos">
        <p>
          Elegís qué negocio querés abrir y un punto en el mapa, y te mostramos cómo es la zona: la competencia, la
          afluencia típica del rubro, la población, el alquiler y el transporte, comparados con el resto de Palermo.
          Cada dato lleva su fuente y su fecha.
        </p>
        <p>
          No te decimos si conviene o no abrir: describimos la zona y marcamos fortalezas y debilidades según tu
          negocio. La decisión es tuya.
        </p>
      </InfoPage.Section>

      <InfoPage.Section title="Dónde estamos">
        <p>
          Hoy cubrimos Palermo (CABA), para gastronomía (restaurantes y cafeterías) y fitness y bienestar (gimnasios y
          pilates).
        </p>
      </InfoPage.Section>

      <InfoPage.Section title="Quiénes somos">
        <p>ProfitZone es un proyecto universitario desarrollado en el seminario de la UADE.</p>
      </InfoPage.Section>

      <InfoPage.Section title="Para seguir leyendo">
        <ul>
          <li>
            <Link to="/reporte-ejemplo">Un reporte de ejemplo</Link>
          </li>
          <li>
            <Link to="/metodologia">Cómo calculamos cada dato</Link>
          </li>
          <li>
            <Link to="/terminos">Términos y condiciones</Link>
          </li>
        </ul>
      </InfoPage.Section>
    </InfoPage>
  )
}

export default SobreNosotros
