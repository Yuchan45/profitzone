import { Outlet } from 'react-router-dom'
import Header from '../../organisms/Header/Header.jsx'
import LeaveFlowGuard from '../../organisms/LeaveFlowGuard/LeaveFlowGuard.jsx'
import './FlowLayout.css'

// Layout del flujo de análisis (rubro → negocio → ubicación → análisis → reporte).
// LeaveFlowGuard avisa al salir del flujo sin guardar el reporte.
function FlowLayout() {
  return (
    <div className="flow-shell">
      <Header />
      <main className="flow-content">
        <Outlet />
      </main>
      <LeaveFlowGuard />
    </div>
  )
}

export default FlowLayout
