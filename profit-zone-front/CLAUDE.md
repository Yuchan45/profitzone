# profit-zone-front — convenciones

SPA en React 19 + Vite, React Router 7 y Axios. JavaScript (JSX), sin TypeScript. Linter: oxlint.

## Estructura y estilo de código

- Componentes como `function Nombre() { ... }` con `export default Nombre` al final del archivo. Excepción: los providers de contexto usan export nombrado (`export function AuthProvider`), como en `src/context/AuthContext.jsx`.
- Hooks con export nombrado (`export function useX`), un hook por archivo.
- Imports relativos con extensión explícita: `./Navbar.jsx`, `../services/api.js`.
- Textos de UI en español.

## Datos y API

- Las llamadas HTTP van solo en `src/services/<dominio>.service.js`, usando la instancia `api` de `src/services/api.js` (ya resuelve `VITE_API_URL` y agrega el token `Bearer`). Cada función devuelve `data`. Ejemplo: `src/services/health.service.js`.
- Los componentes consumen datos a través de hooks en `src/hooks/useX.js` que siguen el patrón de `src/hooks/useHealth.js`:
  - estado `{ status: 'loading' | 'ok' | 'error', data, error }`
  - flag `cancelled` en el cleanup del `useEffect`
  - mensaje de error `error.response?.data?.message ?? error.message`
  - parámetros primitivos en las dependencias del `useEffect`, nunca objetos o arrays creados en el render (provocarían requests infinitos)

## Contextos

- El `createContext` vive en un `.js` aparte (ver `src/context/authContextValue.js`) para cumplir la regla `react/only-export-components`. El provider va en `.jsx` y se consume con un hook (`src/hooks/useAuth.js`).

## Rutas y layout

- Las rutas se definen en `src/App.jsx`, dentro de `<Route element={<MainLayout />}>` y siempre antes de la ruta `*`.
- Los links de navegación van en `src/components/Navbar.jsx` con `NavLink`.

## Estilos y formato

- Estilos globales en `src/index.css` con clases estilo BEM (`api-status`, `api-status-dot`, `api-status--ok`).
- Montos y fechas con `formatCurrency` / `formatDate` de `src/utils/formatters.js` (locale es-AR).

## Validación

Después de cualquier cambio, desde `profit-zone-front/`:

```bash
npm run lint
npm run build
```
