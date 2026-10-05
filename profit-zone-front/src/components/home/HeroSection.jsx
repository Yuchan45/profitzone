import { Link } from 'react-router-dom'
import { Button } from '../ui/button.jsx'
import HeroFigures from './HeroFigures.jsx'

function HeroSection() {
  return (
    <section className="relative flex min-h-[calc(100svh-5rem)] items-center justify-center overflow-hidden bg-linear-to-t from-primary/15 via-primary/5 to-background px-6 py-16">
      <HeroFigures />

      <div className="relative z-10 mx-auto max-w-xl text-center lg:max-w-2xl">
        <h1 className="font-heading text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Evaluá una ubicación antes de abrir tu negocio
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Elegí un punto en Palermo y te mostramos competencia, alquiler, afluencia, demografía y
          accesibilidad de la zona, cruzados con el perfil de tu emprendimiento. Sin crear una
          cuenta.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="h-11 px-6 font-semibold">
            <Link to="/analizar">Analizar una zona</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-11 bg-card px-6 font-semibold">
            <Link to="/reporte-ejemplo">Ver reporte de ejemplo</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

export default HeroSection