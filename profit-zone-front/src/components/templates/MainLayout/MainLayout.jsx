import { Outlet } from 'react-router-dom'
import Navbar from '../../organisms/Navbar/Navbar.jsx'
import Footer from '../../organisms/Footer/Footer.jsx'
import './MainLayout.css'

function MainLayout() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default MainLayout
