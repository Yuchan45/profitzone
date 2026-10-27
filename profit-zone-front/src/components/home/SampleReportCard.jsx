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

/**
 * Vista previa del reporte de ejemplo para la home: su nombre, ubicación y el cuadro de
 * fortalezas y debilidades. `report` es lo que devuelve GET /api/sample-report, así los
 * números son los del reporte completo y no se desactualizan.
 */
function SampleReportCard({ report }) {
  const { analysis, criteria } = report
  const rows = criteria.filter((criterion) => criterion.reading !== 'not_evaluated')

  return (
    <Card className="gap-0 rounded-2xl py-0 shadow-sm">
      <CardContent className="p-6">
        <Badge className="border-0 bg-primary/20 font-medium text-brand-text">Reporte de ejemplo</Badge>

        <h3 className="mt-4 font-heading text-xl font-bold text-foreground">{analysis.name}</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {analysis.address} · radio {analysis.location.radius} m
        </p>

        <ul className="mt-5 space-y-2.5">
          {rows.map((row) => (
            <li
              key={row.code}
              className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-xl bg-secondary px-4 py-3"
            >
              <div className="min-w-0 flex-1 basis-48">
                <p className="text-sm font-semibold text-foreground">{row.label}</p>
                <p className="text-xs leading-snug text-muted-foreground">{row.zone}</p>
              </div>
              <Badge className={`border-0 font-medium ${TONES[row.reading] ?? TONES.neutral}`}>
                {READING_LABELS[row.reading]}
              </Badge>
            </li>
          ))}
        </ul>

        <Link to="/reporte-ejemplo" className="mt-5 inline-block text-sm font-semibold text-brand-text hover:underline">
          Ver reporte completo →
        </Link>
      </CardContent>
    </Card>
  )
}

export default SampleReportCard
