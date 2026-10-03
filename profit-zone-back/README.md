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

## CORS

Configurado en `src/config/cors.js`: solo se aceptan los orígenes de
`CORS_ORIGINS`. Un origen no listado recibe **403**. Las peticiones sin header
`Origin` (curl, Postman, healthchecks) se permiten. Habilita `credentials`, los
headers `Content-Type` y `Authorization`, y cachea el preflight 24 h.

## Endpoints

| Método | Ruta          | Descripción                  |
| ------ | ------------- | ---------------------------- |
| `GET`  | `/api/health` | Estado del servicio y de la DB (`database: up/down`; 503 si la DB no responde) |

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
