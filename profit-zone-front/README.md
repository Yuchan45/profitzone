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
  assets/      recursos estáticos y estilos
  components/  componentes reutilizables (Navbar, Footer, ...)
  context/     contextos de React (AuthContext)
  hooks/       custom hooks (useAuth)
  layouts/     layouts de página (MainLayout)
  pages/       vistas ruteadas (Home, Dashboard, NotFound)
  services/    cliente HTTP y llamadas a la API (api.js)
  utils/       helpers (formatters)
  App.jsx      definición de rutas
  main.jsx     punto de entrada
```
