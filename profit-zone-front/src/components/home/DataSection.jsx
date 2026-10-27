import { Link } from 'react-router-dom'
import { Activity, Banknote, Bus, Store, Users } from 'lucide-react'
import { useSampleReport } from '../../hooks/useSampleReport.js'
import { formatCurrency, formatNumber } from '../../utils/formatters.js'
import SampleReportCard from './SampleReportCard.jsx'

// Los cinco datos del reporte: qué mide cada uno. `example` arma el número de muestra con el
// reporte de ejemplo; sin él (cargando o con error) el dato se muestra igual, sin el número
const DATA_POINTS = [
  {
    icon: Store,
    title: 'Competencia',
    text: 'Cuántos locales como el tuyo hay en el radio, cuáles son competencia directa y qué rating tienen.',
    example: ({ competition }) =>
      `${formatNumber(competition.total)} locales, ${formatNumber(competition.directCount)} directos`,
  },
  {
    icon: Activity,
    title: 'Afluencia',
    text: 'En qué horarios suele haber más clientes en locales de tu rubro, para ver si tu franja coincide.',
    example: ({ traffic }) => `${traffic.score} de ${traffic.scoreMax} en la franja nocturna`,
  },
  {
    icon: Users,
    title: 'Población',
    text: 'Cuánta gente vive en el radio y qué parte es tu público, según el Censo 2022.',
    example: ({ density }) => `${formatNumber(density.poblacionEstimada)} habitantes`,
  },
  {
    icon: Banknote,
    title: 'Alquiler',
    text: 'Cuánto piden por locales en alquiler cerca, para compararlo con tu presupuesto.',
    example: ({ rent }) => `${formatCurrency(rent.medianRentArs, 'ARS', { decimals: 0 })} por mes de mediana`,
  },
  {
    icon: Bus,
    title: 'Transporte',
    text: 'Paradas de colectivo y estaciones de subte y tren, con las líneas que paran en cada una.',
    example: ({ accessibility }) =>
      `${formatNumber(accessibility.total)} paradas, ${formatNumber(accessibility.busLineCount)} líneas`,
  },
]

/** Los datos de un reporte con la vista previa de uno real. Tiene el ancla #que-analizamos. */
function DataSection() {
  const sample = useSampleReport()
  // Los números de ejemplo salen del reporte de ejemplo; sin él, cada dato se muestra sin número
  const figures = sample.status === 'ok' ? pick(sample.data.indicators) : null
  const location = sample.status === 'ok' ? sample.data.analysis : null

  return (
    <section
      id="que-analizamos"
      className="mx-auto max-w-7xl scroll-mt-8 px-6 py-16 lg:py-24"
    >
      <div className="max-w-2xl">
        <h2 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">Qué datos te damos</h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          Cinco datos de la zona que elijas, cada uno con su fuente y su fecha, y comparado con el resto de
          Palermo.
        </p>
      </div>

      <div className="mt-10 grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <ul className="divide-y divide-border">
            {DATA_POINTS.map(({ icon: DataIcon, title, text, example }) => (
              <li key={title} className="flex gap-4 py-5 first:pt-0 last:pb-0">
                <span
                  className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-brand-text"
                  aria-hidden="true"
                >
                  <DataIcon className="size-5" />
                </span>
                <div>
                  <h3 className="font-heading text-base font-bold text-foreground">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
                  {figures && <p className="mt-1.5 text-sm font-semibold text-brand-text">{example(figures)}</p>}
                </div>
              </li>
            ))}
          </ul>
          {location && (
            <p className="mt-6 text-xs text-muted-foreground">
              Números del ejemplo: {location.name}, radio de {location.location.radius} m.{' '}
              <Link to="/metodologia" className="font-semibold text-brand-text hover:underline">
                Cómo calculamos cada dato
              </Link>
            </p>
          )}
        </div>

        <div aria-live="polite">
          {sample.status === 'ok' && <SampleReportCard report={sample.data} />}
          {sample.status === 'loading' && (
            <div className="h-96 animate-pulse rounded-2xl bg-secondary" aria-label="Cargando el reporte de ejemplo" />
          )}
          {sample.status === 'error' && (
            <div className="rounded-2xl bg-secondary p-6 text-sm text-muted-foreground">
              <p>No pudimos cargar el reporte de ejemplo.</p>
              <button type="button" onClick={sample.retry} className="mt-2 font-semibold text-brand-text hover:underline">
                Reintentar
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

// Los datos de cada indicador del reporte, con la forma que usan los ejemplos de DATA_POINTS
function pick({ competition, traffic, density, rent, accessibility }) {
  return {
    competition: competition.data,
    traffic: traffic.data,
    density: density.data,
    rent: rent.data,
    accessibility: accessibility.data,
  }
}

export default DataSection
