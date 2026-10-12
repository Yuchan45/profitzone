import { useEffect, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { cn } from '../../lib/utils.js'
import HowItWorksFigure from './HowItWorksFigure.jsx'

const STEP_MS = 6000

const STEPS = [
  {
    number: '01',
    title: 'Contanos qué querés abrir',
    description: 'Elegí el rubro y respondé unas preguntas rápidas sobre tu negocio.',
  },
  {
    number: '02',
    title: 'Marcá el punto en el mapa',
    description: 'Elegí una ubicación en Palermo y un radio de 200 a 600 m.',
  },
  {
    number: '03',
    title: 'Leé tu reporte',
    description: 'Fortalezas y debilidades de la zona, con la fuente y la fecha de cada dato.',
  },
]

function HowItWorksSection() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [inView, setInView] = useState(false)
  const sectionRef = useRef(null)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.4 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const goNext = () => setActive((i) => (i + 1) % STEPS.length)

  return (
    <section
      id="como-funciona"
      ref={sectionRef}
      className="mx-auto grid max-w-7xl scroll-mt-8 items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:gap-16 lg:py-24"
    >
      <div>
        <h2 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
          ¿Cómo funciona?
        </h2>

        <div className="mt-8">
          {STEPS.map(({ number, title, description }, i) => {
            const isActive = i === active

            return (
              <div key={number}>
                <div className="flex items-center justify-between gap-4 pt-6">
                  <button
                    type="button"
                    onClick={() => setActive(i)}
                    aria-expanded={isActive}
                    className={cn(
                      'flex flex-1 items-baseline gap-3 text-left font-heading text-lg font-bold transition-colors',
                      isActive
                        ? 'text-foreground'
                        : 'text-muted-foreground/70 hover:text-foreground',
                    )}
                  >
                    <span
                      className={cn(
                        'text-sm transition-colors',
                        isActive ? 'text-brand-text' : 'text-muted-foreground/50',
                      )}
                    >
                      {number}
                    </span>
                    {title}
                  </button>

                  {isActive && (
                    <button
                      type="button"
                      onClick={() => setPaused((p) => !p)}
                      aria-label={paused ? 'Reanudar' : 'Pausar'}
                      className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {paused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
                    </button>
                  )}
                </div>

                <div
                  className={cn(
                    'grid transition-[grid-template-rows] duration-300 ease-out',
                    isActive ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="max-w-md pb-5 pl-8 pt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                      {description}
                    </p>
                  </div>
                </div>

                <div className={cn('relative h-0.5 overflow-hidden bg-border', !isActive && 'mt-5')}>
                  {isActive && (
                    <div
                      onAnimationEnd={goNext}
                      className="animate-how-progress absolute inset-0 origin-left bg-primary motion-reduce:animate-none"
                      style={{
                        animationDuration: `${STEP_MS}ms`,
                        animationPlayState: paused || !inView ? 'paused' : 'running',
                      }}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <HowItWorksFigure step={active} />
    </section>
  )
}

export default HowItWorksSection