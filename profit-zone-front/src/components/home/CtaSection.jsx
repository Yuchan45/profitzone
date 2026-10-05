import { Link } from 'react-router-dom'
import { Button } from '../ui/button.jsx'

function CtaSection() {
  return (
    <section className="bg-navy">
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h2 className="font-heading text-3xl font-bold leading-tight text-white sm:text-4xl">
          Mirá los datos de la zona antes de firmar el alquiler
        </h2>
        <p className="mt-4 text-sm text-slate-300">
          Elegí un punto en Palermo y obtené tu reporte en minutos.
        </p>
        <Button asChild size="lg" className="mt-8 h-11 px-6 font-semibold">
          <Link to="/analizar">Analizar una zona</Link>
        </Button>
      </div>
    </section>
  )
}

export default CtaSection