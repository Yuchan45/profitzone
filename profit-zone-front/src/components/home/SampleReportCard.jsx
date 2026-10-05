import { Link } from 'react-router-dom'
import { Badge } from '../ui/badge.jsx'
import { Card, CardContent } from '../ui/card.jsx'

const TONES = {
  success: 'bg-emerald-100 text-emerald-600',
  warning: 'bg-amber-100 text-amber-600',
  danger: 'bg-red-100 text-red-500',
}

const ROWS = [
  { label: 'Público', detail: '68% del radio es tu público', badge: 'Fortaleza', tone: 'success' },
  { label: 'Horario', detail: 'Afluencia alta a la mañana', badge: 'Fortaleza', tone: 'success' },
  { label: 'Costo', detail: 'Alquiler 15% arriba de tu presupuesto', badge: 'Alerta', tone: 'warning' },
  { label: 'Competencia', detail: '6 cafeterías bien valoradas', badge: 'Debilidad', tone: 'danger' },
]

function SampleReportCard() {
  return (
    <Card className="gap-0 rounded-2xl py-0 shadow-sm">
      <CardContent className="p-6">
        <Badge className="border-0 bg-primary/20 font-medium text-brand-text">
          Reporte de ejemplo
        </Badge>

        <h2 className="mt-4 font-heading text-xl font-bold text-foreground">
          Cafetería · Gurruchaga 1600
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">Palermo · radio 300 m</p>

        <ul className="mt-5 space-y-2.5">
          {ROWS.map((row) => (
            <li
              key={row.label}
              className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl bg-secondary px-4 py-3"
            >
              <span className="w-24 text-sm font-semibold text-foreground">{row.label}</span>
              <span className="min-w-40 flex-1 text-xs text-muted-foreground">{row.detail}</span>
              <Badge className={`border-0 font-medium ${TONES[row.tone]}`}>{row.badge}</Badge>
            </li>
          ))}
        </ul>

        <Link
          to="/reporte-ejemplo"
          className="mt-5 inline-block text-sm font-semibold text-brand-text hover:underline"
        >
          Ver reporte completo →
        </Link>
      </CardContent>
    </Card>
  )
}

export default SampleReportCard