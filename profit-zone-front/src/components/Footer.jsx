import { Link } from 'react-router-dom'
import Logo from './Logo.jsx'

const COLUMNS = [
  {
    title: 'Producto',
    links: [
      { label: 'Cómo funciona', href: '/#como-funciona' },
      { label: 'Qué analizamos', href: '/#que-analizamos' },
      { label: 'Reporte de ejemplo', href: '/reporte-ejemplo' },
    ],
  },
  {
    title: 'Compañía',
    links: [
      { label: 'Sobre nosotros', href: '/sobre-nosotros' },
      { label: 'Contacto', href: '/contacto' },
      { label: 'Privacidad', href: '/privacidad' },
    ],
  },
]

function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-12 md:flex-row md:justify-between">
        <div className="max-w-xs space-y-4">
          <Logo />
          <p className="text-sm leading-relaxed text-muted-foreground">
            Análisis de ubicaciones comerciales con datos abiertos y verificables.
          </p>
        </div>

        <div className="flex gap-16">
          {COLUMNS.map((column) => (
            <div key={column.title} className="space-y-3">
              <h3 className="font-heading text-sm font-bold text-foreground">{column.title}</h3>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith('/#') ? (
                      <a
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        to={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  )
}

export default Footer