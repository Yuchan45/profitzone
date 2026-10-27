import InfoPage from '../../components/organisms/InfoPage/InfoPage.jsx'
import { CONTACT_EMAIL } from '../../utils/siteInfo.js'

function Contacto() {
  return (
    <InfoPage title="Contacto" lede="Para consultas sobre los reportes, tus datos o el servicio.">
      <InfoPage.Section title="Escribinos">
        {CONTACT_EMAIL ? (
          <p>
            Por correo a <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Te respondemos lo antes posible.
          </p>
        ) : (
          <p>Todavía no tenemos un canal de contacto público. Muy pronto vamos a publicarlo acá.</p>
        )}
      </InfoPage.Section>

      <InfoPage.Section title="Qué podés consultarnos">
        <ul>
          <li>Dudas sobre cómo leer un reporte o de dónde sale un dato.</li>
          <li>Errores en los datos de una zona.</li>
          <li>Acceso, corrección o eliminación de tus datos personales.</li>
        </ul>
      </InfoPage.Section>
    </InfoPage>
  )
}

export default Contacto
