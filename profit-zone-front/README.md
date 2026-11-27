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

El paso 3 (`/analizar/ubicacion`) y el panel del reporte usan [Leaflet](https://leafletjs.com) con `react-leaflet` y tiles `World_Street_Map` de Esri/ArcGIS (sin clave, con atribución a Esri y OpenStreetMap). Las páginas con mapa se cargan de forma diferida para no sumar Leaflet al bundle inicial. El buscador autocompleta direcciones de Palermo mientras se escribe con `GET /api/geocode`, que combina Photon (OpenStreetMap) y el normalizador del GCBA (USIG).

## Estructura

```
src/
  assets/      recursos estáticos (logo/: logo e isotipo; media/: demo en video y poster)
  components/  componentes reutilizables con atomic design + home/ + ui/ (shadcn)
    atoms/       piezas mínimas (Badge, Button, Checkbox, Chip, Divider, GoogleLogo, HourlyBars, Icon, IconButton, IconTile, Input, Logo, MapBackdrop, RangeSlider, ScoreMeter, SegmentedProgress)
    molecules/   combinaciones de atoms (AddressSearch, Benchmark, CategoryCard, DisclaimerCard, EditableName, FormField, IndicatorCard, InfoTip, PasswordInput, QuestionField, ReportCard, SegmentedNav, SelectionSummary, StatTile, StatusMessage, StepHeading, Toast, UserMenu)
    organisms/   secciones de UI (AuthBrandPanel, BusinessSummary, CriteriaTable, Footer, ForgotPasswordForm, Header, InfoPage, LeaveFlowGuard, LocationMap, LoginForm, Modal, Navbar, PermitsGuide, PlaceCard, QuestionList, RegisterForm, RentalCard, ResetPasswordForm, ScrollToTop, Stepper, TransitCard, ZoneAnalysis, ZoneMapPanel)
    templates/   layouts de página (MainLayout, FlowLayout, AuthLayout, ProtectedRoute)
  context/     contextos de React (AuthContext, AnalysisFlowContext: estado del flujo de análisis)
  hooks/       custom hooks (useAuth, useProfile, useAnalysisReport, useMyAnalyses, etc.)
  pages/       vistas ruteadas (Home, Rubro, Negocio, Ubicacion, Analisis, ReporteEjemplo, MisReportes, ReporteGuardado, Perfil, Login, Registro, RecuperarContrasena, RestablecerContrasena, Metodologia, Tramites, SobreNosotros, Contacto, Terminos, Privacidad, NotFound)
  styles/      tokens.css (paleta, radios, espaciados y fuentes), auth-form.css
  services/    cliente HTTP (api.js) y llamadas a la API por dominio
  utils/       helpers (formatters, geo, validators, hiddenQuestions, permitsGuide, etc.)
  App.jsx      definición de rutas
  main.jsx     punto de entrada
```
