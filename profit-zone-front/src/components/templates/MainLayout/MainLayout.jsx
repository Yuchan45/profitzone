import { Outlet } from 'react-router-dom'
import Navbar from '../../organisms/Navbar/Navbar.jsx'
import Footer from '../../organisms/Footer/Footer.jsx'
import './MainLayout.css'

/**
 * Layout con Navbar + Footer.
 * fullWidth: el contenido ocupa todo el ancho (la landing maneja sus propios contenedores).
 * wide: mismo ancho que las vistas del flujo (FlowLayout), para los reportes con mapa.
 */
function MainLayout({ fullWidth = false, wide = false }) {
  const contentClass = fullWidth ? 'app-content--full' : wide ? 'app-content app-content--wide' : 'app-content'
  return (
    <div className="app-shell">
      <Navbar />
      <main className={contentClass}>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default MainLayout
