import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AnalysisFlowProvider } from './context/AnalysisFlowContext.jsx'
import MainLayout from './components/templates/MainLayout/MainLayout.jsx'
import FlowLayout from './components/templates/FlowLayout/FlowLayout.jsx'
import AuthLayout from './components/templates/AuthLayout/AuthLayout.jsx'
import ProtectedRoute from './components/templates/ProtectedRoute/ProtectedRoute.jsx'
import Home from './pages/Home.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Perfil from './pages/Perfil/Perfil.jsx'
import Rubro from './pages/Rubro/Rubro.jsx'
import Negocio from './pages/Negocio/Negocio.jsx'
import Registro from './pages/Registro/Registro.jsx'
import Login from './pages/Login/Login.jsx'
import Reporte from './pages/Reporte/Reporte.jsx'
import NotFound from './pages/NotFound.jsx'

// El paso de ubicación trae Leaflet (~150 kB): se carga recién al entrar al paso
const Ubicacion = lazy(() => import('./pages/Ubicacion/Ubicacion.jsx'))

function App() {
  return (
    <Routes>
      <Route
        element={
          <AnalysisFlowProvider>
            <FlowLayout />
          </AnalysisFlowProvider>
        }
      >
        <Route path="/analizar/rubro" element={<Rubro />} />
        <Route path="/analizar/negocio" element={<Negocio />} />
        <Route
          path="/analizar/ubicacion"
          element={
            <Suspense fallback={<div className="flow-skeleton" aria-busy="true" aria-label="Cargando el mapa" />}>
              <Ubicacion />
            </Suspense>
          }
        />
        <Route path="/analizar/reporte/:id" element={<Reporte />} />
      </Route>
      <Route element={<AuthLayout />}>
        <Route path="/registro" element={<Registro />} />
        <Route path="/login" element={<Login />} />
      </Route>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        {/* Requieren sesión */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/perfil" element={<Perfil />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default App
