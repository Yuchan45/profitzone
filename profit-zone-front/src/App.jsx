import { Routes, Route } from 'react-router-dom'
import { AnalysisFlowProvider } from './context/AnalysisFlowContext.jsx'
import MainLayout from './components/templates/MainLayout/MainLayout.jsx'
import FlowLayout from './components/templates/FlowLayout/FlowLayout.jsx'
import Home from './pages/Home.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Perfil from './pages/Perfil/Perfil.jsx'
import Rubro from './pages/Rubro/Rubro.jsx'
import Negocio from './pages/Negocio/Negocio.jsx'
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
