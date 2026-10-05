import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="font-heading text-3xl font-bold">404</h1>
      <p className="mt-2 text-muted-foreground">La página que buscás no existe.</p>
      <Link to="/" className="mt-4 inline-block font-semibold text-brand-text hover:underline">
        Volver al inicio
      </Link>
    </section>
  )
}

export default NotFound