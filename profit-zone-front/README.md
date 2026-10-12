# ProfitZone – Frontend

Frontend del proyecto ProfitZone (Seminario UADE), hecho con React + Vite.

## Requisitos

- Node.js 20+

## Scripts

```bash
npm install     # instalar dependencias
npm run dev     # entorno de desarrollo (http://localhost:5173)
npm run build   # build de producción en dist/
npm run preview # previsualizar el build
npm run lint    # linter
```

## Variables de entorno

Copiar `.env.example` a `.env` y ajustar:

| Variable       | Descripción                  |
| -------------- | ---------------------------- |
| `VITE_API_URL` | URL base de la API backend   |

## Mapa

El paso 3 (`/analizar/ubicacion`) usa [Leaflet](https://leafletjs.com) con `react-leaflet` y los tiles
estándar de OpenStreetMap (gratis, sin clave, con atribución), mostrados en grises con CSS. La página se
carga de forma diferida para no sumar Leaflet al bundle inicial. El buscador autocompleta direcciones
de Palermo mientras se escribe con `GET /api/geocode`, que combina Photon (OpenStreetMap) y el
normalizador del GCBA (USIG).

## Estructura

```
src/
  assets/      recursos estáticos (logo/: logo e isotipo de ProfitZone)
  components/  componentes reutilizables con atomic design
    atoms/       piezas mínimas (Button, Chip, Checkbox, Divider, GoogleLogo, Icon, IconTile, Input, Logo, MapBackdrop, SegmentedProgress)
    molecules/   combinaciones de atoms (CategoryCard, FormField, PasswordInput, QuestionField, SegmentedNav, SelectionSummary, StepHeading, StatusMessage, ApiStatus)
    organisms/   secciones de UI (Header, Navbar, Footer, Stepper, QuestionList, RegisterForm, LoginForm, AuthBrandPanel)
    templates/   layouts de página (MainLayout, FlowLayout, AuthLayout)
  context/     contextos de React (AuthContext, AnalysisFlowContext: estado del flujo de análisis)
  hooks/       custom hooks (useAuth)
  pages/       vistas ruteadas (Home, Dashboard, Perfil, Rubro, Negocio, Registro, Login, NotFound)
  styles/      tokens.css: paleta, radios, espaciados y fuentes del Figma
  services/    cliente HTTP y llamadas a la API (api.js)
  utils/       helpers (formatters)
  App.jsx      definición de rutas
  main.jsx     punto de entrada
```
