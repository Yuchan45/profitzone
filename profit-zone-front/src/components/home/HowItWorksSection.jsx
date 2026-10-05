import { BarChart3, Compass, Store } from 'lucide-react'
import { Card, CardContent } from '../ui/card.jsx'

const STEPS = [
  {
    number: '01',
    icon: Store,
    title: 'Contanos qué querés abrir',
    description: 'Elegí el rubro y respondé unas preguntas rápidas sobre tu negocio.',
  },
  {
    number: '02',
    icon: Compass,
    title: 'Marcá el punto en el mapa',
    description: 'Elegí una ubicación en Palermo y un radio de 200 a 600 m.',
  },
  {
    number: '03',
    icon: BarChart3,
    title: 'Leé tu reporte',
    description: 'Fortalezas y debilidades de la zona, con la fuente y la fecha de cada dato.',
  },
]

function HowItWorksSection() {
  return (
    <section id="como-funciona" className="mx-auto max-w-7xl scroll-mt-8 px-6 py-16">
      <div className="text-center">
        <h2 className="font-heading text-3xl font-bold text-foreground">¿Cómo funciona?</h2>
        <p className="mt-2 text-sm text-muted-foreground">En unos minutos y sin registrarte.</p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {STEPS.map(({ number, icon: Icon, title, description }) => (
          <Card key={number} className="relative gap-0 rounded-2xl border-0 bg-secondary py-0 shadow-none">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Icon className="size-5" />
                </span>
                <span className="font-heading text-3xl font-bold text-slate-200">{number}</span>
              </div>
              <h3 className="mt-5 font-heading text-lg font-bold text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

export default HowItWorksSection