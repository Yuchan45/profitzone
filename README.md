# ProfitZone

Monorepo del proyecto **ProfitZone** — Seminario de Integración Profesional, UADE.

El repositorio contiene dos aplicaciones independientes: el cliente web y la API.

| Carpeta                                  | Qué es           | Stack                       | Puerto |
| ---------------------------------------- | ---------------- | --------------------------- | ------ |
| [`profit-zone-front`](./profit-zone-front) | Cliente web (SPA) | React 19 + Vite, React Router, Axios | `5173` |
| [`profit-zone-back`](./profit-zone-back)   | API REST          | Node.js + Express 5 (ESM), Sequelize | `8080` |
| [`docker-compose.yml`](./docker-compose.yml) | Base de datos   | SQL Server 2022 (Docker)    | `1433` |

Cada carpeta tiene su propio `package.json`, sus dependencias y su README con el
detalle específico. No hay workspaces de npm: se instala y se corre cada una por separado.

## Requisitos

- Node.js 20 o superior
- npm 10 o superior
- Docker Desktop (para SQL Server)

## Puesta en marcha

Cloná el repo y preparás cada aplicación una sola vez:

```bash
# Backend + base de datos
cd profit-zone-back
npm install
cp .env.example .env        # Windows: copy .env.example .env  → cambiá DB_PASSWORD
npm run db:up               # levanta SQL Server en Docker
npm run db:migrate          # crea la base y las tablas
npm run db:seed:catalog     # carga el catálogo base (roles, categorías, preguntas)

# Frontend
cd ../profit-zone-front
npm install
cp .env.example .env        # Windows: copy .env.example .env
```

Después, para trabajar hacen falta **dos terminales** (el front necesita el back
levantado para traer los datos, y el back necesita la DB: si el contenedor está
detenido, `npm run db:up`):

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

| Script          | Descripción                          |
| --------------- | ------------------------------------ |
| `npm run dev`   | Levanta la API con recarga (nodemon) |
| `npm start`     | Levanta la API                       |
| `npm run smoke` | Smoke test de la API (puerto 8081)   |
| `npm run db:up` / `db:down` | Levanta / detiene SQL Server en Docker |
| `npm run db:migrate` | Crea la base y aplica migraciones pendientes |
| `npm run db:migrate:undo` / `db:migrate:status` | Revierte la última / lista el estado |
| `npm run db:seed:catalog` | Carga/actualiza el catálogo base (idempotente) |
| `npm run db:seed:catalog:verify` | Verifica el seed (conteos, idempotencia) |

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
| `DB_HOST`      | No          | `localhost`   | Host de SQL Server                                 |
| `DB_PORT`      | No          | `1433`        | Puerto de SQL Server (el que publica Docker)       |
| `DB_NAME`      | No          | `ProfitZone`  | Base de datos                                      |
| `DB_USER`      | No          | `sa`          | Usuario (admin del contenedor, solo desarrollo)    |
| `DB_PASSWORD`  | Sí          | —             | 8+ caracteres, 3 de 4 tipos (A-Z, a-z, 0-9, símbolo), sin `$` |
| `DB_LOGGING`   | No          | `false`       | `true` loguea el SQL de Sequelize                  |
| `GOOGLE_PLACES_API_KEY` | No | —             | Clave de API de Google Places (New) para competidores en el radio |
| `BESTTIME_API_KEY`      | No | —             | Clave de API opcional de BestTime para afluencia estimada |
| `JWT_ACCESS_SECRET`     | Sí | —             | Secreto para firmar los JWT de acceso (32+ caracteres aleatorios) |
| `JWT_ACCESS_TTL`        | No | `15m`         | Vida del JWT de acceso (número + `s`/`m`/`h`/`d`) |
| `REFRESH_TOKEN_TTL_DAYS` | No | `7`          | Vida del refresh token (cookie httpOnly) en días, de 1 a 90 |
| `COOKIE_SECURE`         | No | según entorno | `true` manda la cookie solo por HTTPS. Sin definir: `true` en producción, `false` en desarrollo |

`docker-compose.yml` lee `DB_PASSWORD` y `DB_PORT` de `profit-zone-back/.env`
(los scripts `npm run db:*` le pasan ese archivo), así hay una sola fuente.

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

| Método | Ruta               | Descripción                                                     |
| ------ | ------------------ | --------------------------------------------------------------- |
| `GET`  | `/api/health`      | Estado del servicio y de la DB (503 si la DB no responde)       |
| `GET`  | `/api/density`     | Densidad censal y demografía en un radio de CABA (query: `lat`, `lng`, `radius`) |
| `GET`  | `/api/competition` | Competidores directos/indirectos en el radio con Google Places  |
| `GET`  | `/api/traffic`     | Afluencia horaria (7h-23h) y score por franja horaria           |
| `GET`  | `/api/categories`  | Categorías (rubros) con subcategorías y términos de búsqueda (query: `active`) |
| `GET`  | `/api/categories/:code` | Una categoría con sus subcategorías (404 si no existe)     |
| `GET`  | `/api/categories/:categoryCode/subcategories/:subcategoryCode/questions` | Encuesta completa de un rubro (`business` y `details`) |
| `GET`  | `/api/questions`   | Banco de preguntas con opciones y asignaciones (query: `scope`, `active`) |
| `GET`  | `/api/questions/:code` | Una pregunta con sus opciones en orden (404 si no existe)   |
| `POST` | `/api/analyses` | Crea un análisis en borrador con el rubro y las respuestas (`{ categoryCode, subcategoryCode, answers }`). 201; 400 si faltan obligatorias o hay respuestas inválidas. Sin sesión queda sin dueño; con sesión, a nombre del usuario. Un análisis con dueño solo lo ve su dueño (404 para el resto) |
| `GET`  | `/api/analyses/:id` | Un análisis con su rubro, ubicación y respuestas (404 si no existe) |
| `GET`  | `/api/analyses/:id/report` | Reporte de zona: indicadores del punto y radio, cuadro de fortalezas y debilidades cruzado con las respuestas y resumen (409 si el análisis no tiene ubicación) |
| `PUT`  | `/api/analyses/:id/answers` | Reemplaza todas las respuestas (`{ answers }`), con las mismas validaciones que el alta |
| `PATCH` | `/api/analyses/:id/location` | Guarda el punto y el radio (`{ lat, lng, radius }`, radio entero entre 200 y 600 m, dentro de Palermo; 422 si cae afuera). **Requiere sesión**: el análisis queda a nombre del usuario |
| `GET`  | `/api/neighborhoods` | Barrios donde se puede analizar (MVP: Palermo) con su contorno `[lat, lng]`, sus límites (`bounds`) y un centro ponderado por población, calculados desde el censo |
| `GET`  | `/api/geocode?q=` | Autocompletado de direcciones dentro de Palermo: `[{ type, label, lat?, lng?, detail? }]`. Sin número sugiere calles (`street`, sin coordenadas) y lugares (`place`); con número ("gurruchaga 16") completa la altura (`address`: Gurruchaga 1600). Combina Photon (OSM) y el normalizador del GCBA (USIG) |
| `POST` | `/api/auth/register` | Crea la cuenta (`firstName`, `lastName`, `email`, `password`). 201 `{ user, accessToken }` + cookie de refresh; 409 si el correo existe |
| `POST` | `/api/auth/login` | Inicia sesión. 200 `{ user, accessToken }` + cookie de refresh; 401 genérico si falla |
| `POST` | `/api/auth/refresh` | Renueva la sesión con la cookie `pz_refresh` (rotación). 200 `{ user, accessToken }`; 401 si venció o fue revocada |
| `POST` | `/api/auth/logout` | Revoca el refresh token y borra la cookie. 204 |
| `GET`  | `/api/auth/me` | Usuario de la sesión. Requiere `Authorization: Bearer <accessToken>` |

## Estructura

```
ProfitZone/
├── docker-compose.yml    SQL Server para desarrollo
├── profit-zone-back/
│   ├── scripts/          smoke.js, migrate.js, seed-catalog.js, verify-catalog-seed.js
│   └── src/
│       ├── config/       env.js (validación de entorno), cors.js
│       ├── controllers/  lógica de cada endpoint
│       ├── db/           sequelize.js (conexión singleton), runSql.js, migrations/, seeders/ (+ data/), queries/
│       ├── middlewares/  notFound, errorHandler
│       ├── models/       modelos Sequelize por schema (users, catalog, analysis)
│       ├── routes/       index.js + routers por recurso
│       ├── services/     acceso a datos / lógica de negocio
│       ├── utils/        helpers
│       ├── app.js        configuración de Express
│       └── server.js     punto de entrada
└── profit-zone-front/
    └── src/
        ├── assets/       recursos estáticos
        ├── components/   atomic design: atoms/, molecules/, organisms/, templates/
        ├── context/      contextos de React
        ├── hooks/        custom hooks
        ├── pages/        vistas ruteadas
        ├── styles/       tokens de diseño (paleta del Figma)
        ├── services/     cliente HTTP y llamadas a la API
        ├── utils/        helpers
        ├── App.jsx       definición de rutas
        └── main.jsx      punto de entrada
```

## Commits

Se usa [Conventional Commits](https://www.conventionalcommits.org/) con scope obligatorio:

```
tipo(scope): descripción en minúscula, sin punto final
```

Por ejemplo: `feat(front): add sales page`, `fix(cors): allow preflight requests`,
`docs(readme): document env vars`. Tipos válidos: `feat`, `fix`, `refactor`,
`style`, `docs`, `test`, `perf`, `build`, `ci`, `chore`, `revert`.

Es una convención recomendada, no se valida automáticamente. Claude Code la aplica
siempre a través de la skill `commit`, y la guía completa de tipos y scopes está en
`.claude/skills/commit/SKILL.md`.

## Problemas frecuentes

**La API sale con "No se pudo conectar a SQL Server"**
El contenedor no está corriendo o todavía está arrancando. Desde `profit-zone-back`:
`npm run db:up` (espera a que esté listo). Si es la primera vez, después `npm run db:migrate`.

**`npm run db:up` falla o el contenedor se reinicia en loop**
Casi siempre es `DB_PASSWORD`: SQL Server rechaza claves que no cumplen su política
(8+ caracteres, 3 de 4 tipos). Mirá `npm run db:logs`. Ojo: la clave de `sa` se fija
la **primera** vez que se crea el volumen; si la cambiás después, borrá el volumen
(`docker compose -f ../docker-compose.yml --env-file .env down -v`, **borra los datos**).

**El puerto 1433 ya está en uso**
Hay otro SQL Server local. Cambiá `DB_PORT` en `profit-zone-back/.env` (por ejemplo
`1434`) y volvé a correr `npm run db:up`.

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
