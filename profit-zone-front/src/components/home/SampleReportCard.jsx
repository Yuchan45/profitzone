import { Link } from 'react-router-dom'
import { Badge } from '../ui/badge.jsx'
import { Card, CardContent } from '../ui/card.jsx'
import { READING_LABELS } from '../../utils/reportReadings.js'

const TONES = {
  strength: 'bg-emerald-100 text-emerald-700',
  alert: 'bg-amber-100 text-amber-700',
  weakness: 'bg-red-100 text-red-700',
  neutral: 'bg-secondary text-muted-foreground',
}

// Barra de color a la izquierda de cada fila: se lee el veredicto de un vistazo
const ACCENTS = {
  strength: 'before:bg-emerald-500',
  alert: 'before:bg-amber-500',
  weakness: 'before:bg-red-500',
  neutral: 'before:bg-border',
}

/**
 * Vista previa del reporte de ejemplo para la home: su nombre, ubicación y el cuadro de
 * fortalezas y debilidades. `report` es lo que devuelve GET /api/sample-report, así los
 * números son los del reporte completo y no se desactualizan.
 */
function SampleReportCard({ report }) {
  const { analysis, criteria } = report
  const rows = criteria.filter((criterion) => criterion.reading !== 'not_evaluated')

  return (
    <Card className="gap-0 overflow-hidden rounded-2xl border-border py-0 shadow-lg shadow-navy/5">
      <div className="bg-linear-to-br from-primary/20 via-primary/10 to-transparent px-5 pb-5 pt-6 sm:px-6">
        <Badge className="border-0 bg-card font-medium text-brand-text shadow-sm">Reporte de ejemplo</Badge>

        <h3 className="mt-4 font-heading text-xl font-bold leading-tight text-foreground sm:text-2xl">{analysis.name}</h3>
        <p className="mt-1.5 text-xs text-muted-foreground sm:text-sm">
          {analysis.address} · radio {analysis.location.radius} m
        </p>
      </div>

      <CardContent className="p-5 pt-4 sm:p-6 sm:pt-4">
        <ul className="space-y-2.5">
          {rows.map((row) => (
            <li
              key={row.code}
              className={`relative overflow-hidden rounded-xl border border-border bg-card py-3 pl-5 pr-4 shadow-sm transition duration-200 before:absolute before:inset-y-0 before:left-0 before:w-1 hover:shadow-md motion-reduce:transition-none ${ACCENTS[row.reading] ?? ACCENTS.neutral}`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-foreground">{row.label}</p>
                <Badge className={`shrink-0 border-0 font-medium ${TONES[row.reading] ?? TONES.neutral}`}>
                  {READING_LABELS[row.reading]}
                </Badge>
              </div>
              <p className="mt-1 text-xs leading-snug text-muted-foreground sm:text-sm">{row.zone}</p>
            </li>
          ))}
        </ul>

        <Link
          to="/reporte-ejemplo"
          className="group mt-5 inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-4 py-2 text-sm font-semibold text-brand-text transition-all duration-200 hover:gap-2.5 hover:bg-primary/25"
        >
          Ver reporte completo
          <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-0.5">
            →
          </span>
        </Link>
      </CardContent>
    </Card>
  )
}

export default SampleReportCard
