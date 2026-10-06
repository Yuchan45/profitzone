import { Link } from 'react-router-dom'
import { Button } from '../ui/button.jsx'
import HeroFigures from './HeroFigures.jsx'
import FlipWords from './FlipWords.jsx'

const FLIP_WORDS = ['la ubicación', 'la competencia', 'el alquiler', 'la afluencia', 'la demografía']

function HeroSection() {
  return (
    <section className="relative flex min-h-[calc(100svh-5rem)] items-center justify-center overflow-hidden bg-linear-to-t from-primary/15 via-primary/5 to-background px-6 py-16">
      <HeroFigures />

      <div className="relative z-10 mx-auto max-w-xl text-center lg:max-w-2xl">
        <h1 className="font-heading text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          <span className="block">
            Evaluá <FlipWords words={FLIP_WORDS} />
          </span>
          <span className="block">antes de abrir tu negocio</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          No prometemos decirte qué negocio va a tener éxito, ni eliminamos el riesgo de emprender.
          <span className="mt-2 block font-bold text-brand-text">Sólo reducimos tu incertidumbre</span>
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