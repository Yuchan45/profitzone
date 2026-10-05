# ProfitZone – Backend

API del proyecto ProfitZone (Seminario UADE), hecha con Node.js + Express 5 (ESM).

## Requisitos

- Node.js 20+
- Docker Desktop (para SQL Server)

## Puesta en marcha

```bash
npm install
cp .env.example .env   # en Windows: copy .env.example .env  → cambiá DB_PASSWORD
npm run db:up          # levanta SQL Server (docker-compose.yml de la raíz) y espera a que esté listo
npm run db:migrate     # crea la base ProfitZone y aplica las migraciones
npm run db:seed:catalog  # carga el catálogo base (roles, categorías, preguntas)
npm run db:seed:census   # carga los datos censales de CABA con índice espacial
npm run dev            # http://localhost:8080/api
```

La API se conecta a la base al arrancar: si SQL Server no está levantado, sale
con un error que indica cómo levantarlo.

## Scripts

| Script          | Descripción                          |
| --------------- | ------------------------------------ |
| `npm start`     | Levanta la API                       |
| `npm run dev`   | Levanta la API con recarga (nodemon) |
| `npm run smoke` | Smoke test: levanta la API en el 8081, prueba rutas y la apaga (`npm run smoke -- /api/x`). Requiere la DB levantada |
| `npm run db:up` | Levanta SQL Server en Docker y espera a que esté healthy |
| `npm run db:down` | Detiene el contenedor (los datos quedan en el volumen `mssql-data`) |
| `npm run db:logs` | Logs de SQL Server |
| `npm run db:migrate` | Crea la base si no existe y aplica las migraciones pendientes |
| `npm run db:migrate:undo` | Revierte la última migración (`-- all` revierte todas) |
| `npm run db:migrate:status` | Lista migraciones aplicadas y pendientes |
| `npm run db:seed:catalog` | Carga/actualiza el catálogo base. Idempotente: se puede correr N veces |
| `npm run db:seed:catalog:verify` | Corre el seed y verifica conteos, idempotencia y preguntas por subcategoría |
| `npm run db:seed:census` | Carga los 3.554 radios censales de CABA en `census_data.census_radios` con geometrías e índice espacial |

## Variables de entorno

Se validan al arrancar en `src/config/env.js`: si falta una obligatoria o tiene
un formato inválido, el proceso falla con un mensaje explicando qué corregir.

| Variable       | Obligatoria | Default       | Descripción                                            |
| -------------- | ----------- | ------------- | ------------------------------------------------------ |
| `NODE_ENV`     | No          | `development` | `development` \| `test` \| `production`                |
| `PORT`         | No          | `8080`        | Puerto de escucha (1-65535)                            |
| `CORS_ORIGINS` | Sí          | —             | URLs permitidas, separadas por coma (`http://...`)     |
| `DB_HOST`      | No          | `localhost`   | Host de SQL Server                                     |
| `DB_PORT`      | No          | `1433`        | Puerto de SQL Server (también el que publica Docker)   |
| `DB_NAME`      | No          | `ProfitZone`  | Base de datos (identificador simple: letras, números, `_`) |
| `DB_USER`      | No          | `sa`          | Usuario (en desarrollo, el admin del contenedor)       |
| `DB_PASSWORD`  | Sí          | —             | Clave: 8+ caracteres, 3 de 4 tipos (A-Z, a-z, 0-9, símbolo). Sin `$`. Docker la usa para crear `sa` |
| `DB_LOGGING`   | No          | `false`       | `true` muestra en consola el SQL de Sequelize          |
| `GOOGLE_PLACES_API_KEY` | No | —             | Clave de API de Google Places (New) para competidores en el radio |
| `BESTTIME_API_KEY`      | No | —             | Clave de API opcional para afluencia BestTime (fallback a modelo estimado) |

## CORS

Configurado en `src/config/cors.js`: solo se aceptan los orígenes de
`CORS_ORIGINS`. Un origen no listado recibe **403**. Las peticiones sin header
`Origin` (curl, Postman, healthchecks) se permiten. Habilita `credentials`, los
headers `Content-Type` y `Authorization`, y cachea el preflight 24 h.

## Endpoints

| Método | Ruta          | Descripción                  |
| ------ | ------------- | ---------------------------- |
| `GET`  | `/api/health` | Estado del servicio y de la DB (`database: up/down`; 503 si la DB no responde) |
| `GET`  | `/api/density` | Densidad poblacional y demografía en un punto con radio en CABA (query: `lat`, `lng`, `radius`) |
| `GET`  | `/api/competition` | Análisis de competidores directos e indirectos en un radio con Google Places |
| `GET`  | `/api/traffic` | Estimación de afluencia horaria (7h a 23h) y score por franja horaria |
| `GET`  | `/api/categories` | Categorías (rubros) con sus subcategorías y términos de búsqueda (query: `active`) |
| `GET`  | `/api/categories/:code` | Una categoría por code con sus subcategorías (404 si no existe; query: `active`) |
| `GET`  | `/api/categories/:categoryCode/subcategories/:subcategoryCode/questions` | Encuesta completa de un rubro (solo activas), separada en `business` y `details` |
| `GET`  | `/api/questions` | Banco de preguntas con opciones y asignaciones (query: `scope`, `active`) |
| `GET`  | `/api/questions/:code` | Una pregunta por code con sus opciones en orden (404 si no existe; query: `active`) |
| `POST` | `/api/analyses` | Crea un análisis en borrador con el rubro y las respuestas (`{ categoryCode, subcategoryCode, answers }`). 201; 400 si faltan obligatorias o hay respuestas inválidas |
| `GET`  | `/api/analyses/:id` | Un análisis con su rubro, ubicación y respuestas (404 si no existe) |
| `PUT`  | `/api/analyses/:id/answers` | Reemplaza todas las respuestas (`{ answers }`), con las mismas validaciones que el alta |
| `PATCH` | `/api/analyses/:id/location` | Guarda el punto y el radio (`{ lat, lng, radius }`, radio entero entre 200 y 600 m) |

### `GET /api/density`

Calcula la densidad poblacional, viviendas, hogares y nivel socioeconómico (% NBI) para un círculo definido por un punto central y un radio de influencia sobre la Ciudad Autónoma de Buenos Aires (CABA).

#### Parámetros de consulta (Query Params)

| Parámetro | Tipo     | Requerido | Default | Descripción / Restricciones |
| --------- | -------- | :-------: | :-----: | --------------------------- |
| `lat`     | `number` | Sí        | —       | Latitud en grados decimales (rango: `-90` a `90`). Ej: `-34.5880`. |
| `lng`     | `number` | Sí        | —       | Longitud en grados decimales (rango: `-180` a `180`). Ej: `-58.4300`. |
| `radius`  | `number` | No        | `500`   | Radio de búsqueda en metros (entero entre `10` y `20000`). Ej: `1000`. |

#### Ejemplo de solicitud

```http
GET /api/density?lat=-34.5880&lng=-58.4300&radius=1000 HTTP/1.1
Host: localhost:8080
```

#### Metodología de cálculo (Ponderación Areal)

El cálculo se ejecuta en el motor espacial nativo de SQL Server 2022 (`geography` con índice espacial `IX_census_radios_geom`):
1. Se genera un buffer circular con `geography::Point(@lat, @lng, 4326).STBuffer(@radius)`.
2. Se detectan los radios censales intersectados con `geom.STIntersects(@buffer) = 1`.
3. Para cada radio censal, se calcula la fracción de área contenida dentro del círculo con `geom.STIntersection(@buffer).STArea() / geom.STArea()`.
4. Los habitantes, viviendas y hogares se ponderan proporcionalmente a dicha fracción, garantizando precisión sin sobreestimar radios censales parcialmente intersectados.

### `GET /api/competition`

Obtiene el análisis de competidores directos e indirectos en un radio alrededor de unas coordenadas usando la API de Google Places (New).

#### Parámetros de consulta (Query Params)

| Parámetro     | Tipo     | Requerido | Default       | Descripción / Restricciones |
| ------------- | -------- | :-------: | :-----------: | --------------------------- |
| `lat`         | `number` | Sí        | —             | Latitud en grados decimales (`-90` a `90`). Ej: `-34.5880`. |
| `lng`         | `number` | Sí        | —             | Longitud en grados decimales (`-180` a `180`). Ej: `-58.4300`. |
| `radius`      | `number` | No        | `1000`        | Radio en metros (`10` a `20000`). Ej: `1000`. |
| `subcategory` | `string` | No        | `restaurante` | Código del rubro (`restaurante`, `cafeteria`, `gimnasio`, `pilates`). |

#### Ejemplo de solicitud y respuesta

```http
GET /api/competition?lat=-34.5880&lng=-58.4300&radius=1000&subcategory=cafeteria HTTP/1.1
Host: localhost:8080
```

```json
{
  "total": 20,
  "directCount": 18,
  "indirectCount": 2,
  "averageRating": 4.5,
  "subcategory": "cafeteria",
  "subcategoryName": "cafeterías",
  "callout": "Hay bastante competencia directa y bien valorada cerca del punto.",
  "source": "Google Places",
  "places": [
    {
      "id": "ChIJcc8jgsy1vJUR7iCGeBH0ynk",
      "name": "Local Support",
      "rating": 4.4,
      "userRatingCount": 1177,
      "distanceMeters": 179,
      "distanceText": "179 m",
      "type": "Directa",
      "location": {
        "lat": -34.58899,
        "lng": -58.43153
      }
    }
  ]
}
```

### `GET /api/traffic`

Provee la estimación de afluencia horaria (curva de 7 h a 23 h) y el score de actividad (0 a 100) para una franja horaria objetivo.

#### Parámetros de consulta (Query Params)

| Parámetro     | Tipo     | Requerido | Default       | Descripción / Restricciones |
| ------------- | -------- | :-------: | :-----------: | --------------------------- |
| `lat`         | `number` | Sí        | —             | Latitud en grados decimales (`-90` a `90`). Ej: `-34.5880`. |
| `lng`         | `number` | Sí        | —             | Longitud en grados decimales (`-180` a `180`). Ej: `-58.4300`. |
| `radius`      | `number` | No        | `1000`        | Radio en metros (`10` a `20000`). Ej: `1000`. |
| `subcategory` | `string` | No        | `restaurante` | Código del rubro (`restaurante`, `cafeteria`, `gimnasio`, `pilates`). |
| `schedule`    | `string` | No        | `morning`     | Preset horario: `morning` (8-11h), `lunch` (12-15h), `afternoon` (16-19h), `dinner` (20-23h), `night` (21-23h), `day` (8-20h). |
| `startHour`   | `number` | No        | —             | Hora de inicio personalizada (0 a 23). |
| `endHour`     | `number` | No        | —             | Hora de fin personalizada (0 a 23). |

#### Ejemplo de solicitud y respuesta

```http
GET /api/traffic?lat=-34.5880&lng=-58.4300&radius=1000&subcategory=cafeteria&schedule=morning HTTP/1.1
Host: localhost:8080
```

```json
{
  "score": 77,
  "scoreMax": 100,
  "timeSlot": "mañana, 8 a 11 h",
  "startHour": 8,
  "endHour": 11,
  "hourlyActivity": [
    { "hour": 7, "label": "7 h", "value": 15, "isHighlighted": false },
    { "hour": 8, "label": "8 h", "value": 48, "isHighlighted": true },
    { "hour": 9, "label": "9 h", "value": 82, "isHighlighted": true },
    { "hour": 10, "label": "10 h", "value": 94, "isHighlighted": true },
    { "hour": 11, "label": "11 h", "value": 85, "isHighlighted": true }
  ],
  "callout": "La actividad sube fuerte a la mañana, en línea con tu franja de desayuno.",
  "badge": "Estimado",
  "source": "BestTime (popular times de locales del radio) · forecast 2026 · mide entradas a locales, no peatones"
}
```

### Catálogo: `GET /api/categories` y `GET /api/questions`

Exponen el catálogo cargado por `npm run db:seed:catalog` (equivalen a las consultas 1 a 9 de `src/db/queries/basic_queries.sql`). Todo se identifica por `code`, nunca por `id`.

| Parámetro | Endpoints | Descripción |
| --------- | --------- | ----------- |
| `active`  | `/api/categories`, `/api/categories/:code`, `/api/questions`, `/api/questions/:code` | Opcional. `true` devuelve solo registros activos y `false` solo inactivos. Sin el parámetro devuelve todo, con `isActive` en cada fila. Otro valor → 400. |
| `scope`   | `/api/questions` | Opcional. `global`, `category` o `subcategory`: deja solo las preguntas asignadas con ese scope. Otro valor → 400. |

En `/api/questions`, `isShared: true` marca las preguntas asignadas en más de un rubro.

```http
GET /api/categories?active=true HTTP/1.1
Host: localhost:8080
```

```json
[
  {
    "code": "gastronomia",
    "name": "Gastronomía",
    "description": "Restaurantes y cafeterías.",
    "sortOrder": 1,
    "isActive": true,
    "subcategoryCount": 2,
    "subcategories": [
      {
        "code": "restaurante",
        "name": "Restaurante",
        "description": null,
        "sortOrder": 1,
        "isActive": true,
        "searchTerms": [{ "termType": "type", "termValue": "restaurant", "isPrimary": true }]
      }
    ]
  }
]
```

### `GET /api/categories/:categoryCode/subcategories/:subcategoryCode/questions`

Arma la encuesta que ve el usuario de un rubro: preguntas globales, de su categoría y de su subcategoría, **solo activas**, en el orden en que se muestran. `business` es el paso "Tu negocio" y `details` el de detalles del rubro. Responde 404 si la combinación categoría/subcategoría no existe o está inactiva.

```http
GET /api/categories/gastronomia/subcategories/cafeteria/questions HTTP/1.1
Host: localhost:8080
```

```json
{
  "category": { "code": "gastronomia", "name": "Gastronomía" },
  "subcategory": { "code": "cafeteria", "name": "Cafetería" },
  "business": [
    {
      "code": "service_mode",
      "prompt": "¿Cómo vas a atender al público?",
      "helpText": null,
      "inputType": "single_choice",
      "section": "business",
      "scope": "global",
      "sortOrder": 1,
      "isRequired": true,
      "options": [
        { "code": "street", "label": "Local a la calle", "valueMin": null, "valueMax": null, "isUnknown": false, "metadata": null, "sortOrder": 1, "isActive": true }
      ]
    }
  ],
  "details": []
}
```

## Base de datos

SQL Server 2022 en Docker (`docker-compose.yml` en la raíz del repo), con
Sequelize como ORM. El esquema (schemas `users`, `catalog`, `analysis`) se crea
**solo** con migraciones en T-SQL (`src/db/migrations`), versionadas con Umzug en
la tabla `dbo.SequelizeMeta`. Los modelos (`src/models`) mapean esas tablas y
nunca las crean (`sync()` no se usa).

La conexión es un singleton (`src/db/sequelize.js`) que se verifica al arrancar
con reintentos y se cierra al apagar la API.

### Catálogo base (seed)

`npm run db:seed:catalog` carga roles, categorías, subcategorías, términos de
búsqueda, preguntas, opciones y asignaciones. Los datos están en
`src/db/seeders/data/catalog.js`; para cambiar un texto se edita ahí y se vuelve
a correr el seed, que actualiza la fila existente (mismo id). El seed nunca
borra: lo que se saca del archivo queda en la DB (el catálogo usado se
desactiva con `is_active = 0`). Corre todo en una transacción.

### Densidad Base (seed)
`npm run db:seed:census` carga en la base datos iniciales radiales para calcular la densidad poblacional. Los datos lo carga desde `src\db\seeders\data\caba_census_radios.geojson` que fue descargado desde `https://cdn.buenosaires.gob.ar/datosabiertos/datasets/informacion-censal-por-radio/CABA_rc.geojson` 

|Variable|Tipo|Significado|
|--------|----|-----------|
RADIO_ID|	Código oficial|	Clave jerárquica del INDEC: Comuna_Fracción_Radio (ej: 14_3_12).|
BARRIO|	Nombre|	Uno de los 48 barrios oficiales de CABA.|
COMUNA|	1 a 15|	Comuna política a la que pertenece el radio.|
POBLACION|	Conteo real|	Cantidad exacta de personas censadas en esas manzanas.|
VIVIENDAS|	Conteo real|	Total de unidades habitacionales particulares y colectivas.|
HOGARES|	Conteo real|	Total de hogares censados en el radio.|
HOGARES_NBI|	Indicador| INDEC	Hogares con Necesidades Básicas Insatisfechas (mide hacinamiento, calidad de vivienda, saneamiento y escolaridad).|
AREA_KM2|	Geometría|Superficie real del polígono calculada por la cartografía oficial.|
geometry|	MultiPolygon|	Coordenadas vectoriales exactas de los límites de las manzanas en WGS84.|


## Estructura

```
scripts/        smoke.js, migrate.js, seed-catalog.js, verify-catalog-seed.js
src/
  config/       env.js (validación), cors.js
  controllers/  lógica de cada endpoint
  db/           sequelize.js (conexión singleton), migrations/, seeders/ (lógica + data/), runSql.js
  middlewares/  notFound, errorHandler
  models/       modelos Sequelize por schema (users/, catalog/, analysis/) + index.js (asociaciones)
  routes/       index.js + routers por recurso
  services/     acceso a datos / lógica de negocio
  utils/        helpers
  app.js        configuración de Express
  server.js     punto de entrada (conecta la DB y levanta el server)
```
