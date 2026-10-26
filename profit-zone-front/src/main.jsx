import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import '@fontsource-variable/outfit'
import '@fontsource-variable/plus-jakarta-sans'
import { AuthProvider } from './context/AuthContext.jsx'
import ScrollToTop from './components/organisms/ScrollToTop/ScrollToTop.jsx'
import App from './App.jsx'
import './index.css'

// Router de datos con una sola ruta comodín: las rutas siguen en App.jsx (<Routes>), pero
// así funciona useBlocker, que avisa al salir del flujo de análisis sin terminar
const router = createBrowserRouter([
  {
    path: '*',
    element: (
      <>
        <ScrollToTop />
        <AuthProvider>
          <App />
        </AuthProvider>
      </>
    ),
  },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
