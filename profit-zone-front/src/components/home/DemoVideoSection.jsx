import { useEffect, useRef } from 'react'
import demoVideo from '../../assets/media/ProfitZoneDemo.mp4'
import demoPoster from '../../assets/media/demo-poster.jpeg'

// Con "reducir movimiento" activado, el video no arranca solo: se reproduce con sus controles
const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

/**
 * Video demo del flujo, debajo de "¿Cómo funciona?". Arranca solo (sin sonido) cuando entra en
 * pantalla y se pausa al salir, para no reproducirse mientras nadie lo mira.
 */
function DemoVideoSection() {
  const videoRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || prefersReducedMotion()) return undefined
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {})
        else video.pause()
      },
      { threshold: 0.5 },
    )
    observer.observe(video)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      id="demo"
      className="reveal-on-scroll mx-auto max-w-5xl scroll-mt-8 px-6 py-16 lg:py-24"
    >
      <div className="text-center">
        <span className="inline-flex rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-brand-text">
          Demo
        </span>
        <h2 className="mt-4 font-heading text-3xl font-bold text-foreground sm:text-4xl">
          Miralo en acción
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
          El recorrido completo, de tu negocio al reporte de la zona.
        </p>
      </div>

      <video
        ref={videoRef}
        className="mt-8 aspect-video w-full rounded-2xl border border-border bg-card object-cover shadow-xl shadow-navy/10 sm:mt-10"
        src={demoVideo}
        poster={demoPoster}
        muted
        loop
        playsInline
        controls
        preload="metadata"
        aria-label="Demo de ProfitZone: cómo se analiza una zona paso a paso"
      />
    </section>
  )
}

export default DemoVideoSection
