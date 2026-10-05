import { Outlet } from 'react-router-dom'
import Header from '../../organisms/Header/Header.jsx'
import './FlowLayout.css'

// Layout del flujo de análisis (rubro → negocio → ubicación → análisis → reporte).
function FlowLayout() {
  return (
    <div className="flow-shell">
      <Header />
      <main className="flow-content">
        <Outlet />
      </main>
    </div>
  )
}

export default FlowLayout
