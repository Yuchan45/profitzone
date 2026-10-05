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
      'Competencia de Google Places en vivo; demografía del Censo 2022 (INDEC); alquiler de informes públicos del mercado inmobiliario; accesibilidad de datos abiertos del Gobierno de la Ciudad y OpenStreetMap.',
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
    <section id="preguntas-frecuentes" className="mx-auto max-w-3xl scroll-mt-8 px-6 py-16">
      <h2 className="text-center font-heading text-3xl font-bold text-foreground">
        Preguntas frecuentes
      </h2>

      <Accordion
        type="multiple"
        defaultValue={FAQS.map((faq) => faq.question)}
        className="mt-10 space-y-3"
      >
        {FAQS.map((faq) => (
          <AccordionItem
            key={faq.question}
            value={faq.question}
            className="rounded-xl border bg-card px-5 last:border-b"
          >
            <AccordionTrigger className="font-heading text-sm font-bold text-foreground hover:no-underline">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-xs leading-relaxed text-muted-foreground">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}

export default FaqSection