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
import MisReportes from './pages/MisReportes/MisReportes.jsx'
import ReporteGuardado from './pages/ReporteGuardado/ReporteGuardado.jsx'
import Rubro from './pages/Rubro/Rubro.jsx'
import Negocio from './pages/Negocio/Negocio.jsx'
import Registro from './pages/Registro/Registro.jsx'
import Login from './pages/Login/Login.jsx'
import RecuperarContrasena from './pages/RecuperarContrasena/RecuperarContrasena.jsx'
import RestablecerContrasena from './pages/RestablecerContrasena/RestablecerContrasena.jsx'
import Reporte from './pages/Reporte/Reporte.jsx'
import Terminos from './pages/Terminos/Terminos.jsx'
import NotFound from './pages/NotFound.jsx'

// Los pasos de ubicación y análisis traen Leaflet (~150 kB): se cargan recién al entrar al paso
const Ubicacion = lazy(() => import('./pages/Ubicacion/Ubicacion.jsx'))
const Analisis = lazy(() => import('./pages/Analisis/Analisis.jsx'))

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
        {/* El análisis siempre tiene dueño: espera a recuperar la sesión y, sin sesión, pide login */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="/analizar/analisis/:id"
            element={
              <Suspense fallback={<div className="flow-skeleton" aria-busy="true" aria-label="Cargando el análisis" />}>
                <Analisis />
              </Suspense>
            }
          />
          <Route path="/analizar/reporte/:id" element={<Reporte />} />
        </Route>
      </Route>
      <Route element={<AuthLayout />}>
        <Route path="/registro" element={<Registro />} />
        <Route path="/login" element={<Login />} />
        <Route path="/recuperar-contrasena" element={<RecuperarContrasena />} />
        <Route path="/restablecer-contrasena" element={<RestablecerContrasena />} />
      </Route>
      {/* La landing usa ancho completo: sus secciones tienen fondos de borde a borde */}
      <Route element={<MainLayout fullWidth />}>
        <Route path="/" element={<Home />} />
      </Route>
      <Route element={<MainLayout />}>
        <Route path="/terminos" element={<Terminos />} />
        {/* Requieren sesión */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/mis-reportes" element={<MisReportes />} />
          <Route path="/mis-reportes/:id" element={<ReporteGuardado />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default App
