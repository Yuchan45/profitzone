import StatTile from '../../molecules/StatTile/StatTile.jsx'
import DisclaimerCard from '../../molecules/DisclaimerCard/DisclaimerCard.jsx'
import { formatCurrency, formatNumber } from '../../../utils/formatters.js'
import './ZoneReport.css'

// Google Places devuelve como máximo 20 locales por consulta
const COMPETITION_MAX_RESULTS = 20

const PENDING_CAPTION = 'Dato pendiente'

// Cada dato de la zona según el estado de su indicador: ok, error, sin cobertura o no aplica
function competitionTile({ status, data }) {
  if (status === 'not_applicable') return { value: null, caption: 'No aplica sin atención al público' }
  if (status !== 'ok') return { value: null, caption: 'No pudimos cargar este dato' }
  const value = data.total >= COMPETITION_MAX_RESULTS ? `${data.total}+` : formatNumber(data.total)
  return { value, caption: `${data.directCount} directos` }
}

function trafficTile({ status, data }) {
  if (status === 'not_applicable') return { value: null, caption: 'No aplica sin atención al público' }
  if (status !== 'ok') return { value: null, caption: 'No pudimos cargar este dato' }
  return { value: `${data.score}/${data.scoreMax}`, caption: data.timeSlot }
}

function populationTile({ status, data }) {
  if (status !== 'ok') return { value: null, caption: 'No pudimos cargar este dato' }
  if (!data.inCoverage) return { value: null, caption: 'Fuera de la cobertura del censo' }
  return { value: formatNumber(data.poblacionEstimada), caption: 'habitantes en el radio' }
}

function rentTile({ status, data }) {
  if (status !== 'ok') return { value: null, caption: 'No pudimos cargar este dato' }
  // Solo los avisos con precio forman la mediana
  if (data.pricedInRadius === 0) return { value: null, caption: 'Sin locales en alquiler publicados en el radio' }
  const listings = data.pricedInRadius === 1 ? '1 aviso' : `${formatNumber(data.pricedInRadius)} avisos`
  return {
    value: formatCurrency(data.medianRentArs, 'ARS', { decimals: 0 }),
    caption: `por mes, mediana de ${listings}`,
  }
}

/**
 * Cuerpo del reporte de zona: resumen, datos de la zona, fuentes y aviso legal.
 * `children` va entre el resumen y los datos: ahí cada página pone el cuadro de
 * fortalezas y debilidades (CriteriaTable), que es otro organism.
 * Lo usa el historial (ReporteGuardado); en el flujo, el reporte va en el paso 4 (Análisis).
 */
function ZoneReport({ report, children }) {
  return (
    <>
      <section className="zone-report-card" aria-labelledby="zone-report-summary-title">
        <h2 id="zone-report-summary-title" className="zone-report-card-title">
          Resumen
        </h2>
        <p className="zone-report-summary">{report.summary}</p>
      </section>

      {children}

      <section className="zone-report-card" aria-labelledby="zone-report-data-title">
        <h2 id="zone-report-data-title" className="zone-report-card-title">
          La zona en datos
        </h2>
        <div className="zone-report-tiles">
          <StatTile label="Competencia" {...competitionTile(report.indicators.competition)} />
          <StatTile label="Afluencia (estimada)" {...trafficTile(report.indicators.traffic)} />
          <StatTile label="Población" {...populationTile(report.indicators.density)} />
          <StatTile label="Alquiler" {...rentTile(report.indicators.rent)} />
          <StatTile label="Accesibilidad" value={null} caption={PENDING_CAPTION} />
        </div>
      </section>

      <section className="zone-report-card" aria-labelledby="zone-report-sources-title">
        <h2 id="zone-report-sources-title" className="zone-report-card-title">
          Fuentes y avisos
        </h2>
        <ul className="zone-report-notes">
          {[...report.notices, ...report.sources].map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </section>

      <DisclaimerCard />
    </>
  )
}

export default ZoneReport
