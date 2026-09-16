# ProfitZone

Monorepo del proyecto **ProfitZone** — Seminario de Integración Profesional, UADE.

El repositorio contiene dos aplicaciones independientes: el cliente web y la API.

| Carpeta                                  | Qué es           | Stack                       | Puerto |
| ---------------------------------------- | ---------------- | --------------------------- | ------ |
| [`profit-zone-front`](./profit-zone-front) | Cliente web (SPA) | React 19 + Vite, React Router, Axios | `5173` |
| [`profit-zone-back`](./profit-zone-back)   | API REST          | Node.js + Express 5 (ESM)   | `8080` |

Cada carpeta tiene su propio `package.json`, sus dependencias y su README con el
detalle específico. No hay workspaces de npm: se instala y se corre cada una por separado.

## Requisitos

- Node.js 20 o superior
- npm 10 o superior

## Puesta en marcha

Cloná el repo y preparás cada aplicación una sola vez:

```bash
# Backend
cd profit-zone-back
npm install
cp .env.example .env        # Windows: copy .env.example .env

# Frontend
cd ../profit-zone-front
npm install
cp .env.example .env        # Windows: copy .env.example .env
```

Después, para trabajar hacen falta **dos terminales** (el front necesita el back
levantado para traer los datos):

```bash
# Terminal 1 — API en http://localhost:8080/api
cd profit-zone-back && npm run dev

# Terminal 2 — Web en http://localhost:5173
cd profit-zone-front && npm run dev
```

Abrí http://localhost:5173. En la pantalla de inicio hay un indicador de estado:
si dice **"API conectada"**, el front está hablando con el back correctamente.

## Scripts

### `profit-zone-back`

| Script        | Descripción                          |
| ------------- | ------------------------------------ |
| `npm run dev` | Levanta la API con recarga (nodemon) |
| `npm start`   | Levanta la API                       |

### `profit-zone-front`

| Script            | Descripción                       |
| ----------------- | --------------------------------- |
| `npm run dev`     | Servidor de desarrollo de Vite    |
| `npm run build`   | Build de producción en `dist/`    |
| `npm run preview` | Previsualiza el build             |
| `npm run lint`    | Linter (oxlint)                   |

## Variables de entorno

Ninguno de los `.env` se versiona: cada uno se genera a partir del `.env.example`
de su carpeta.

**`profit-zone-back/.env`**

| Variable       | Obligatoria | Default       | Descripción                                        |
| -------------- | ----------- | ------------- | -------------------------------------------------- |
| `NODE_ENV`     | No          | `development` | `development` \| `test` \| `production`            |
| `PORT`         | No          | `8080`        | Puerto de escucha                                  |
| `CORS_ORIGINS` | Sí          | —             | URLs permitidas, separadas por coma                |

**`profit-zone-front/.env`**

| Variable       | Obligatoria | Default | Descripción                |
| -------------- | ----------- | ------- | -------------------------- |
| `VITE_API_URL` | No          | `http://localhost:8080/api` | URL base de la API |

> Las dos puntas tienen que quedar coherentes: `VITE_API_URL` apunta al `PORT` del
> back, y la URL del front (`http://localhost:5173`) tiene que estar listada en
> `CORS_ORIGINS`. Si cambiás una, actualizá la otra.

El backend valida sus variables al arrancar: si falta una obligatoria o tiene un
formato inválido, el proceso no levanta y lista en consola qué corregir.

## Cómo se comunican

```
profit-zone-front  ──HTTP──▶  profit-zone-back
  VITE_API_URL                  CORS_ORIGINS
  (a dónde pega)                (a quién le contesta)
```

El front centraliza las llamadas en `src/services/api.js` (instancia de Axios con
`baseURL` e interceptor que agrega el token `Authorization` si existe). El back
acepta únicamente los orígenes de `CORS_ORIGINS`; cualquier otro recibe **403**.

### Endpoints

| Método | Ruta          | Descripción         |
| ------ | ------------- | ------------------- |
| `GET`  | `/api/health` | Estado del servicio |

## Estructura

```
ProfitZone/
├── profit-zone-back/
│   └── src/
│       ├── config/       env.js (validación de entorno), cors.js
│       ├── controllers/  lógica de cada endpoint
│       ├── middlewares/  notFound, errorHandler
│       ├── routes/       index.js + routers por recurso
│       ├── services/     acceso a datos / lógica de negocio
│       ├── utils/        helpers
│       ├── app.js        configuración de Express
│       └── server.js     punto de entrada
└── profit-zone-front/
    └── src/
        ├── assets/       recursos estáticos y estilos
        ├── components/   componentes reutilizables
        ├── context/      contextos de React
        ├── hooks/        custom hooks
        ├── layouts/      layouts de página
        ├── pages/        vistas ruteadas
        ├── services/     cliente HTTP y llamadas a la API
        ├── utils/        helpers
        ├── App.jsx       definición de rutas
        └── main.jsx      punto de entrada
```

## Problemas frecuentes

**El front muestra "Sin conexión con la API"**
Revisá que el back esté levantado, que `VITE_API_URL` apunte al puerto correcto y
que `http://localhost:5173` esté en `CORS_ORIGINS`. Después de tocar un `.env` del
front hay que reiniciar Vite (no lo toma en caliente).

**`El puerto 8080 ya está en uso`**
Quedó un proceso anterior escuchando. Buscalo y cerralo:

```bash
netstat -ano | findstr :8080
taskkill /PID <pid> /F
```

**nodemon dice `clean exit` y la API no responde**
Mismo caso que el anterior: en Windows un puerto ocupado puede hacer que el
proceso salga en silencio. Liberá el puerto o cambiá `PORT` en el `.env`.

**Error de CORS en la consola del navegador**
El origen desde el que estás pegando no está en `CORS_ORIGINS`. Agregalo (separado
por comas) y reiniciá el backend.
