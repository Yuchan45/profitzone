import { Link } from 'react-router-dom'
import Logo from './Logo.jsx'
import { Button } from './ui/button.jsx'

const NAV_LINKS = [
  { label: 'Cómo funciona', href: '/#como-funciona' },
  { label: 'Qué analizamos', href: '/#que-analizamos' },
  { label: 'Reporte de ejemplo', href: '/reporte-ejemplo' },
]

function Navbar() {
  return (
    <header className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-6">
      <Logo />

      <nav className="hidden items-center gap-10 md:flex">
        {NAV_LINKS.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="text-sm font-medium text-foreground transition-colors hover:text-brand-text"
          >
            {link.label}
          </a>
        ))}
      </nav>

      <div className="flex items-center gap-5">
        <Link
          to="/login"
          className="hidden text-sm font-medium text-foreground transition-colors hover:text-brand-text sm:inline"
        >
          Iniciar sesión
        </Link>
        <Button asChild className="font-semibold">
          <Link to="/analizar">Analizar una zona</Link>
        </Button>
      </div>
    </header>
  )
}

export default Navbar