import { Link } from 'react-router-dom'
import { Button } from '../ui/button.jsx'
import SampleReportCard from './SampleReportCard.jsx'

function HeroSection() {
  return (
    <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-12 lg:grid-cols-2 lg:py-20">
      <div>
        <h1 className="font-heading text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl">
          Evaluá una ubicación antes de abrir tu negocio
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
          Elegí un punto en Palermo y te mostramos competencia, alquiler, afluencia, demografía y
          accesibilidad de la zona, cruzados con el perfil de tu emprendimiento. Sin crear una
          cuenta.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg" className="h-11 px-6 font-semibold">
            <Link to="/analizar">Analizar una zona</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-11 bg-card px-6 font-semibold">
            <Link to="/reporte-ejemplo">Ver reporte de ejemplo</Link>
          </Button>
        </div>
      </div>

      <SampleReportCard />
    </section>
  )
}

export default HeroSection