import { Link } from 'react-router-dom'
import InfoPage from '../../components/organisms/InfoPage/InfoPage.jsx'

function Privacidad() {
  return (
    <InfoPage
      title="Privacidad"
      lede="Qué datos guardamos, para qué los usamos y con quién los compartimos."
      updated="Última actualización: Octubre de 2026"
    >
      <InfoPage.Section title="Qué datos guardamos">
        <ul>
          <li>De tu cuenta: nombre, apellido, correo y tu contraseña, que se guarda cifrada (nunca en texto plano).</li>
          <li>
            De tus análisis: las respuestas sobre tu negocio, el punto y el radio que elegiste, la dirección y el
            reporte generado.
          </li>
          <li>De tu sesión: una cookie segura para mantenerte conectado, que el navegador no deja leer a otros sitios.</li>
        </ul>
        <p>No usamos herramientas de seguimiento publicitario ni de analítica de terceros.</p>
      </InfoPage.Section>

      <InfoPage.Section title="Para qué los usamos">
        <p>
          Para mostrarte tus reportes en Mis reportes, mantener tu sesión y enviarte el correo de recuperación de
          contraseña. No vendemos tus datos.
        </p>
      </InfoPage.Section>

      <InfoPage.Section title="Con quién compartimos información">
        <p>Para armar un reporte consultamos servicios externos, que reciben solo lo necesario para responder:</p>
        <ul>
          <li>Google Places: las coordenadas del punto, el radio y el tipo de local, para traer los competidores.</li>
          <li>Esri: tu navegador pide los mosaicos del mapa, como en cualquier mapa en línea.</li>
          <li>Google Fonts: tu navegador descarga las tipografías del sitio.</li>
        </ul>
        <p>Ninguno recibe tu nombre ni tu correo.</p>
      </InfoPage.Section>

      <InfoPage.Section title="Tus derechos">
        <p>
          Podés borrar tus reportes desde Mis reportes. Para acceder a tus datos personales, corregirlos o pedir que
          eliminemos tu cuenta, escribinos desde <Link to="/contacto">Contacto</Link>.
        </p>
      </InfoPage.Section>
    </InfoPage>
  )
}

export default Privacidad
