import { Routes, Route } from 'react-router-dom'
import MainLayout from './components/templates/MainLayout/MainLayout.jsx'
import FlowLayout from './components/templates/FlowLayout/FlowLayout.jsx'
import RequireRubro from './components/templates/RequireRubro/RequireRubro.jsx'
import Home from './pages/Home.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Perfil from './pages/Perfil/Perfil.jsx'
import Rubro from './pages/Rubro/Rubro.jsx'
import TuNegocio from './pages/TuNegocio/TuNegocio.jsx'
import Detalles from './pages/Detalles/Detalles.jsx'
import NotFound from './pages/NotFound.jsx'
import { ANALYSIS_PATHS } from './utils/analysisSteps.js'

function App() {
  return (
    <Routes>
      <Route element={<FlowLayout />}>
        <Route path={ANALYSIS_PATHS.rubro} element={<Rubro />} />
        <Route element={<RequireRubro />}>
          <Route path={ANALYSIS_PATHS.negocio} element={<TuNegocio />} />
          <Route path={ANALYSIS_PATHS.detalles} element={<Detalles />} />
        </Route>
      </Route>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default App
