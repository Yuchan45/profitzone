import { Outlet } from 'react-router-dom'
import Navbar from '../../organisms/Navbar/Navbar.jsx'
import Footer from '../../organisms/Footer/Footer.jsx'
import './MainLayout.css'

/**
 * Layout con Navbar + Footer.
 * fullWidth: el contenido ocupa todo el ancho (la landing maneja sus propios contenedores).
 */
function MainLayout({ fullWidth = false }) {
  return (
    <div className="app-shell">
      <Navbar />
      <main className={fullWidth ? 'app-content--full' : 'app-content'}>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default MainLayout
