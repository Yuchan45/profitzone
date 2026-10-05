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
import NotFound from './pages/NotFound.jsx'

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
