import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion.jsx'

const FAQS = [
  {
    question: '¿De dónde salen los datos?',
    answer:
      'Competencia de OpenStreetMap y Google Places (rating y reseñas); demografía del Censo 2022 (INDEC); alquiler de los avisos de locales publicados en ZonaProp (mediana dentro del radio que elegís); accesibilidad de paradas y estaciones de OpenStreetMap, con sus líneas.',
  },
  {
    question: '¿El reporte me dice si conviene abrir?',
    answer:
      'No. Describe la zona y marca fortalezas y debilidades según tu negocio. La decisión es tuya.',
  },
  {
    question: '¿Necesito crear una cuenta?',
    answer:
      'No para analizar ni para exportar el PDF. Solo si querés guardar el reporte y volver a verlo en Mis reportes.',
  },
  {
    question: '¿Qué zonas y rubros cubre?',
    answer:
      'Por ahora Palermo (CABA): Gastronomía (restaurante y cafetería) y Fitness y bienestar (gimnasio y pilates).',
  },
]

function FaqSection() {
  return (
    <section id="preguntas-frecuentes" className="mx-auto max-w-3xl scroll-mt-8 px-5 py-16 sm:px-6 lg:py-24">
      <div className="text-center">
        <span className="inline-flex rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-brand-text">
          Dudas comunes
        </span>
        <h2 className="mt-4 font-heading text-3xl font-bold text-foreground sm:text-4xl">
          Preguntas frecuentes
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
          Lo que más nos preguntan antes de analizar una zona.
        </p>
      </div>

      <Accordion
        type="single"
        collapsible
        defaultValue={FAQS[0].question}
        className="mt-8 space-y-3 sm:mt-10"
      >
        {FAQS.map((faq) => (
          <AccordionItem
            key={faq.question}
            value={faq.question}
            className="reveal-on-scroll rounded-2xl border border-border bg-card px-5 shadow-sm transition duration-300 last:border-b hover:border-primary/40 data-[state=open]:border-primary/50 data-[state=open]:shadow-lg data-[state=open]:shadow-navy/5 motion-reduce:transition-none sm:px-6"
          >
            <AccordionTrigger className="min-h-14 items-center gap-4 py-4 text-left font-heading text-base font-bold leading-snug text-foreground hover:no-underline sm:text-lg">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="pr-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}

export default FaqSection