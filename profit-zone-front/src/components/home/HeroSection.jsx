import { Link } from 'react-router-dom'
import { Button } from '../ui/button.jsx'
import { NEW_ANALYSIS_LINK } from '../../utils/flowSteps.js'
import FlipWords from './FlipWords.jsx'
import demoVideo from '../../assets/media/ProfitZoneDemo.mp4'

const FLIP_WORDS = ['la ubicación', 'la competencia', 'el alquiler', 'la afluencia', 'la demografía']

// Con "reducir movimiento" activado, el video no arranca solo: se reproduce con sus controles
const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

// Hero de la home: video demo del flujo a la izquierda y el mensaje a la derecha.
// En pantallas chicas el texto va primero y el video abajo.
function HeroSection() {
  const autoPlay = !prefersReducedMotion()

  return (
    <section className="relative flex min-h-[calc(100svh-5rem)] items-center overflow-hidden bg-linear-to-t from-primary/15 via-primary/5 to-background px-6 py-16">
      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-12">
        <div className="order-2 lg:order-1">
          <video
            className="aspect-video w-full rounded-2xl border border-border bg-card object-cover shadow-xl shadow-navy/10"
            src={demoVideo}
            autoPlay={autoPlay}
            muted
            loop
            playsInline
            controls
            preload={autoPlay ? 'auto' : 'metadata'}
            aria-label="Demo de ProfitZone: cómo se analiza una zona paso a paso"
          />
        </div>

        <div className="order-1 text-center lg:order-2 lg:text-left">
          <h1 className="font-heading text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-[2.75rem] xl:text-5xl">
            <span className="block">
              Evaluá <FlipWords words={FLIP_WORDS} />
            </span>
            <span className="block">antes de abrir tu negocio</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg lg:mx-0">
            No prometemos decirte qué negocio va a tener éxito, ni eliminamos el riesgo de emprender.
            <span className="mt-2 block font-bold text-brand-text">Sólo reducimos tu incertidumbre</span>
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
            <Button asChild size="lg" className="h-11 px-6 font-semibold">
              <Link {...NEW_ANALYSIS_LINK}>Analizar una zona</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-11 bg-card px-6 font-semibold">
              <Link to="/reporte-ejemplo">Ver reporte de ejemplo</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
