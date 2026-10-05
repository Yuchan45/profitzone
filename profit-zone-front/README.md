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

## Estructura

```
src/
  assets/      recursos estáticos
  components/  componentes reutilizables con atomic design
    atoms/       piezas mínimas (Button, Chip, Icon, IconTile, Logo)
    molecules/   combinaciones de atoms (CategoryCard, QuestionField, StepHeading, StatusMessage, ApiStatus)
    organisms/   secciones de UI (Header, Navbar, Footer, Stepper, QuestionList)
    templates/   layouts de página (MainLayout, FlowLayout)
  context/     contextos de React (AuthContext, AnalysisFlowContext: estado del flujo de análisis)
  hooks/       custom hooks (useAuth)
  pages/       vistas ruteadas (Home, Dashboard, Perfil, Rubro, Negocio, NotFound)
  styles/      tokens.css: paleta, radios, espaciados y fuentes del Figma
  services/    cliente HTTP y llamadas a la API (api.js)
  utils/       helpers (formatters)
  App.jsx      definición de rutas
  main.jsx     punto de entrada
```
