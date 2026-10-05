# profit-zone-front — convenciones

SPA en React 19 + Vite, React Router 7 y Axios. JavaScript (JSX), sin TypeScript. Linter: oxlint.

## Estructura y estilo de código

- Componentes como `function Nombre() { ... }` con `export default Nombre` al final del archivo. Excepción: los providers de contexto usan export nombrado (`export function AuthProvider`), como en `src/context/AuthContext.jsx`.
- Hooks con export nombrado (`export function useX`), un hook por archivo.
- Imports relativos con extensión explícita: `./Navbar.jsx`, `../services/api.js`.
- Textos de UI en español.

## Atomic design

Los componentes viven en `src/components/` organizados por nivel. **Una carpeta por componente**, con su `.jsx` y su `.css` al lado (el `.jsx` importa su `.css`):

```
src/components/
  atoms/       piezas mínimas sin lógica de negocio: Button, Chip, Icon, IconTile, Logo
  molecules/   combinación chica de atoms con un propósito: CategoryCard, ApiStatus
  organisms/   secciones completas de la UI: Header, Navbar, Footer, Stepper
  templates/   layouts de página con <Outlet />: MainLayout, FlowLayout
src/pages/     vistas ruteadas; arman la pantalla con organisms/molecules/atoms
```

- Cómo elegir el nivel: si no se puede dividir en algo útil, es **atom**. Si junta 2 o más atoms para una tarea puntual (una card, un campo con label), es **molecule**. Si es un bloque autónomo de la pantalla (header, stepper, tabla, formulario completo), es **organism**. Si define la estructura de la página y renderiza `<Outlet />`, es **template**.
- Regla de imports: un nivel solo importa niveles inferiores (atoms ← molecules ← organisms ← templates ← pages). Un atom nunca importa una molecule.
- Atoms y molecules son presentacionales: reciben datos y callbacks por props, sin hooks de datos ni llamadas a servicios. Los hooks de `src/hooks/` se usan desde organisms o pages (excepción existente: `molecules/ApiStatus`).
- Antes de crear un componente, buscar en estos niveles si ya existe uno reutilizable o extensible con una prop o variante.
- Las páginas con estilos propios van en carpeta (`pages/Rubro/Rubro.jsx` + `Rubro.css`).
- Los componentes de UI replican los del Figma "ProfitZone › v3 - Layout" (página `componentes`). Mantener los mismos nombres de variantes cuando aplique (Button `primary | secondary | text | danger`, tamaños `l | m`).

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

- Las rutas se definen en `src/App.jsx`, dentro del template que corresponda y siempre antes de la ruta `*`:
  - `<Route element={<MainLayout />}>` (Navbar + Footer): Home, Dashboard, Perfil.
  - `<Route element={<FlowLayout />}>` (Header simple): pasos del flujo de análisis bajo `/analizar/*` (ej. `/analizar/rubro`).
- Los links de navegación van en `src/components/organisms/Navbar/Navbar.jsx` con `NavLink`.

## Estilos y formato

- **Paleta y tokens:** todos los colores, radios, espaciados y fuentes están en `src/styles/tokens.css` como variables CSS (copiados del Figma). Usar siempre `var(--color-…)`, `var(--radius-…)`, `var(--space-…)`, `var(--text-…)`, `var(--font-heading)` / `var(--font-body)`. **Nada de hex sueltos** fuera de `tokens.css` (excepción: colores de marcas de terceros, como el logo de Google). Si falta un color, se agrega primero a `tokens.css`.
- Tipografía: `Outfit` para títulos y botones (`--font-heading`), `Geist` para texto (`--font-body`). Se cargan desde Google Fonts en `index.html`.
- `src/index.css` solo tiene el reset y los estilos base (body, headings, links, focus). Los estilos de cada componente van en su `.css`.
- Clases estilo BEM con el nombre del componente en kebab-case: bloque `.category-card`, elementos `.category-card-title`, modificadores `.category-card--selected`.
- Montos y fechas con `formatCurrency` / `formatDate` de `src/utils/formatters.js` (locale es-AR).

## Validación

Después de cualquier cambio, desde `profit-zone-front/`:

```bash
npm run lint
npm run build
```
