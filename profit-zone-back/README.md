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
| `npm run db:seed:rentals` | Carga los 3.800 locales comerciales en alquiler de CABA en `commercial_data.commercial_rentals` con geometrías e índice espacial |
| `npm run db:seed:osm-places` | Carga en `osm_data.places` los restaurantes, cafés, gimnasios y estudios de pilates de OpenStreetMap del barrio disponible (+2 km), para la vista previa del paso 3 |
| `npm run db:seed:osm-transit` | Carga en `osm_data.transit_stops` las paradas de colectivo y estaciones de subte y tren de OpenStreetMap del barrio disponible (+2 km), con sus líneas, para el indicador de accesibilidad |
| `npm run db:seed:all` | Aplica las migraciones y corre todos los seeds en orden (catálogo, censo, locales, negocios y transporte de OSM) con un resumen al final. Saltea los locales si falta el JSON de Zonaprop y OSM si falla el censo |

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
| `BESTTIME_API_KEY`      | No | —             | Reservada para integrar BestTime más adelante. **Todavía no se usa**: la afluencia es un perfil horario fijo por rubro, igual en todo Palermo |
| `JWT_ACCESS_SECRET`     | Sí | —             | Secreto para firmar los JWT de acceso (32+ caracteres aleatorios) |
| `JWT_ACCESS_TTL`        | No | `15m`         | Vida del JWT de acceso (número + `s`/`m`/`h`/`d`) |
| `REFRESH_TOKEN_TTL_DAYS` | No | `7`          | Vida del refresh token (cookie httpOnly) en días, de 1 a 90 |
| `COOKIE_SECURE`         | No | según entorno | `true` manda la cookie solo por HTTPS. Sin definir: `true` en producción, `false` en desarrollo |
| `FRONTEND_URL`          | No | `http://localhost:5173` | URL del front, base de los links que se mandan por correo (restablecer contraseña) |
| `SMTP_HOST`             | No | —             | Servidor SMTP para mandar correos. Sin definir no se mandan: en desarrollo el link se muestra en la consola |
| `SMTP_PORT`             | No | `587`         | Puerto SMTP (`465` usa TLS directo; el resto, STARTTLS) |
| `SMTP_USER`             | No | —             | Usuario SMTP |
| `SMTP_PASSWORD`         | No | —             | Contraseña SMTP |
| `SMTP_FROM`             | No | `ProfitZone <no-reply@profitzone.local>` | Remitente de los correos |

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
| `GET`  | `/api/competition` | Análisis de competidores directos e indirectos en un radio con Google Places. **Requiere sesión** (consume una API paga) |
| `GET`  | `/api/places/nearby?lat=&lng=&radius=&category=&subcategory=&match=` | Vista previa del paso 3: negocios del rubro dentro del círculo (radio de 100 a 2000 m), desde OpenStreetMap (`osm_data.places`, gratis, sin sesión). `match` (opcional, `pregunta:opción`, ej. `cuisine_type:asian`) marca como `direct` los que coinciden con la cocina elegida. Responde `{ source, updatedAt, total, directTotal, directLabel, places: [{ id, name, lat, lng, direct }] }`. 400 si los parámetros son inválidos |
| `GET`  | `/api/sample-report` | Reporte de ejemplo de la home ("Ver reporte de ejemplo"): restaurante de cocina asiática en Palermo Soho. Misma forma que `GET /api/analyses/:id/report`, más `business` (`{ categoryCode, subcategoryCode, answers }`). Público y sin consultas pagas: sale de `src/data/sampleReport.json`, con los locales de Google Places anonimizados |
| `GET`  | `/api/places/:id` | Ficha de un negocio de la vista previa (datos de OpenStreetMap, sin sesión): `{ id, kind, name, cuisines, lat, lng, details, source, updatedAt }`. `details` trae solo lo que el local tenga cargado en OSM (`street`, `houseNumber`, `openingHours`, `phone`, `website`, `instagram`, `facebook`, `outdoorSeating`, `delivery`, `takeaway`, `wheelchair`). 404 si no existe |
| `GET`  | `/api/traffic` | Estimación de afluencia horaria (7h a 23h) y score por franja horaria |
| `GET`  | `/api/rentals` | Promedio y estadísticas de alquileres comerciales en un radio (query: `lat`, `lng`, `radius`; 503 si no hay avisos cargados) |
| `GET`  | `/api/categories` | Categorías (rubros) con sus subcategorías y términos de búsqueda (query: `active`) |
| `GET`  | `/api/categories/:code` | Una categoría por code con sus subcategorías (404 si no existe; query: `active`) |
| `GET`  | `/api/categories/:categoryCode/subcategories/:subcategoryCode/questions` | Encuesta completa de un rubro (solo activas), separada en `business` y `details` |
| `GET`  | `/api/questions` | Banco de preguntas con opciones y asignaciones (query: `scope`, `active`) |
| `GET`  | `/api/questions/:code` | Una pregunta por code con sus opciones en orden (404 si no existe; query: `active`) |
| `GET`  | `/api/analyses` | Mis análisis ("Mis reportes"), del más reciente al más viejo, con estado, nombre (`null` si no lo renombró), rubro, ubicación, dirección y fechas (sin respuestas). `?status=saved` (default: reportes guardados, los que ya analizaron la zona) o `?status=draft` (borradores: sin ubicación todavía); 400 con otro valor |
| `POST` | `/api/analyses` | Crea un análisis en borrador con el rubro y las respuestas (`{ categoryCode, subcategoryCode, answers }`). 201; 400 si faltan obligatorias o hay respuestas inválidas. Queda a nombre del usuario. **Todos los endpoints de `/api/analyses` requieren sesión** (401 sin ella) y cada análisis solo lo ve su dueño (404 para el resto) |
| `GET`  | `/api/analyses/:id` | Un análisis con su rubro, ubicación y respuestas (404 si no existe) |
| `GET`  | `/api/analyses/:id/report` | Reporte de zona: indicadores del punto y radio, cuadro de fortalezas y debilidades cruzado con las respuestas, resumen y `benchmarks`: cada dato comparado con Palermo (mediana y percentil del punto entre los 295 centros de radios censales del barrio, medidos con el mismo radio; densidad contra el promedio del barrio; `null` si no se pudieron calcular). Ver la página `/metodologia` del front (409 si el análisis no tiene ubicación) |
| `PUT`  | `/api/analyses/:id/answers` | Reemplaza todas las respuestas (`{ answers }`), con las mismas validaciones que el alta |
| `PATCH` | `/api/analyses/:id/location` | Guarda el punto y el radio (`{ lat, lng, radius }`, radio entero entre 100 y 2000 m, dentro de Palermo; 422 si cae afuera; más de 600 m solo para los roles `premium` y `admin`, si no 403). Se llama al tocar "Analizar zona": el análisis pasa a `saved` y aparece en Mis reportes (volver a analizar actualiza el mismo reporte). Busca y guarda la dirección del punto (`address`); si la búsqueda falla, se guarda igual sin dirección |
| `PATCH` | `/api/analyses/:id` | Renombra el análisis (`{ name }`, texto de hasta 80 caracteres; vacío o `null` vuelve a mostrar el rubro). 400 si es más largo |
| `DELETE` | `/api/analyses/:id` | Elimina un análisis, borrador o reporte guardado (y sus respuestas). 204 |
| `GET`  | `/api/neighborhoods` | Barrios donde se puede analizar (MVP: Palermo) con su contorno `[lat, lng]`, sus límites (`bounds`) y un centro ponderado por población, calculados desde el censo |
| `GET`  | `/api/geocode?q=` | Autocompletado de direcciones dentro de Palermo: `[{ type, label, lat?, lng?, detail? }]`. Sin número sugiere calles (`street`, sin coordenadas) y lugares (`place`); con número ("gurruchaga 16") completa la altura (`address`: Gurruchaga 1600). Combina Photon (OSM) y el normalizador del GCBA (USIG). 400 si la búsqueda tiene menos de 3 o más de 120 caracteres; 502 si los servicios externos no responden |
| `GET`  | `/api/geocode/reverse?lat=&lng=` | Dirección más cercana a un punto de Palermo, para completar el buscador cuando el punto se elige en el mapa: `{ label }` (`label: null` si no hay una dirección cerca o el punto cae fuera del barrio). Usa la búsqueda inversa de USIG y, si falla, Photon. 400 si las coordenadas son inválidas; 502 si los dos servicios fallan |
| `POST` | `/api/auth/register` | Crea la cuenta (`firstName`, `lastName`, `email`, `password`). 201 `{ user, accessToken }` + cookie de refresh; 409 si el correo existe |
| `POST` | `/api/auth/login` | Inicia sesión. 200 `{ user, accessToken }` + cookie de refresh; 401 genérico si falla |
| `POST` | `/api/auth/refresh` | Renueva la sesión con la cookie `pz_refresh` (rotación). 200 `{ user, accessToken }`; 401 si venció o fue revocada |
| `POST` | `/api/auth/logout` | Revoca el refresh token y borra la cookie. 204 |
| `POST` | `/api/auth/forgot-password` | Pide restablecer la contraseña (`{ email }`): manda un link de un solo uso que vence en 30 min. 202 genérico exista o no la cuenta; límite de 5 pedidos cada 15 min por IP |
| `POST` | `/api/auth/reset-password` | Cambia la contraseña con el link (`{ token, password }`) y cierra todas las sesiones de la cuenta. 204; 400 si el link venció, ya se usó o la contraseña no cumple el largo |
| `GET`  | `/api/auth/me` | Usuario de la sesión. Requiere `Authorization: Bearer <accessToken>` |

### `GET /api/density`

Calcula la densidad poblacional, viviendas, hogares, nivel socioeconómico (% NBI), distribución por rangos de edad (`kids`, `young`, `adults`, `seniors`) y distribución por sexo (`mujeres` / `varones`, índice de feminidad y predominio) para un círculo definido por un punto central y un radio de influencia sobre la Ciudad Autónoma de Buenos Aires (CABA).

#### Parámetros de consulta (Query Params)

| Parámetro | Tipo     | Requerido | Default | Descripción / Restricciones |
| --------- | -------- | :-------: | :-----: | --------------------------- |
| `lat`     | `number` | Sí        | —       | Latitud en grados decimales (rango: `-90` a `90`). Ej: `-34.5880`. |
| `lng`     | `number` | Sí        | —       | Longitud en grados decimales (rango: `-180` a `180`). Ej: `-58.4300`. |
| `radius`  | `number` | No        | `500`   | Radio de búsqueda en metros (entero entre `10` y `20000`). Ej: `1000`. |

#### Ejemplo de solicitud y respuesta

```http
GET /api/density?lat=-34.5880&lng=-58.4300&radius=500 HTTP/1.1
Host: localhost:8080
```

```json
{
  "center": { "lat": -34.588, "lng": -58.43 },
  "radiusInMeters": 500,
  "bufferAreaKm2": 0.7854,
  "bufferAreaHa": 78.54,
  "radiosInterceptados": 26,
  "poblacionEstimada": 9042,
  "densidadHabKm2": 11513,
  "densidadHabHa": 115.13,
  "viviendasEstimadas": 5172,
  "hogaresEstimados": 3868,
  "hogaresNbiEstimados": 269,
  "porcentajeNbi": 6.95,
  "distribucionPorEdad": {
    "kids": { "code": "kids", "label": "Familias / niños (0–14)", "range": "0-14", "poblacionEstimada": 957, "porcentaje": 10.58 },
    "young": { "code": "young", "label": "Jóvenes (15–34)", "range": "15-34", "poblacionEstimada": 2849, "porcentaje": 31.51 },
    "adults": { "code": "adults", "label": "Adultos (35–59)", "range": "35-59", "poblacionEstimada": 3096, "porcentaje": 34.24 },
    "seniors": { "code": "seniors", "label": "Adultos mayores (60+)", "range": "60+", "poblacionEstimada": 2141, "porcentaje": 23.68 },
    "grupoPredominante": { "code": "adults", "label": "Adultos (35–59)", "porcentaje": 34.24 }
  },
  "distribucionPorSexo": {
    "mujeresEstimadas": 4926,
    "varonesEstimados": 4116,
    "porcentajeMujeres": 54.48,
    "porcentajeVarones": 45.52,
    "indiceFeminidad": 119.7,
    "diferencia": 810,
    "predominio": "mujeres",
    "callout": "En la zona hay más mujeres que varones (54,48% vs. 45,52%, 119,7 mujeres cada 100 varones)."
  },
  "barrios": ["PALERMO"],
  "comunas": [14],
  "inCoverage": true
}
```

#### Metodología de cálculo (Ponderación Areal)

El cálculo se ejecuta en el motor espacial nativo de SQL Server 2022 (`geography` con índice espacial `IX_census_radios_geom`):
1. Se genera un buffer circular con `geography::Point(@lat, @lng, 4326).STBuffer(@radius)`.
2. Se detectan los radios censales intersectados con `geom.STIntersects(@buffer) = 1`.
3. Para cada radio censal, se calcula la fracción de área contenida dentro del círculo con `geom.STIntersection(@buffer).STArea() / geom.STArea()`.
4. Los habitantes, viviendas, hogares, rangos etarios (`edad_0_14`, `edad_15_34`, `edad_35_59`, `edad_60_mas`) y población por sexo (`mujeres`, `varones`) se ponderan proporcionalmente a dicha fracción, garantizando precisión sin sobreestimar radios censales parcialmente intersectados.

### `GET /api/competition`

Obtiene el análisis de competidores directos e indirectos en un radio alrededor de unas coordenadas usando la API de Google Places (New), con una sola consulta.

- Con `match` de una cocina (ej. `cuisine_type:asian`) la consulta pide los tipos de Google de esa cocina (`metadata.googleTypes` de la opción en el catálogo) y `listMode` es `cuisine`; sin cocina, pide los tipos generales del rubro (`general`). Google devuelve hasta 20 locales, los más populares.
- Los competidores directos que están en OpenStreetMap y Google no trajo se suman a `places` sin rating (`source: "osm"`).
- `places` viene ordenado por fuerza: directos primero, después por `strength` (rating ajustado por cantidad de reseñas); sin datos de Google, al final.
- `total` y `directCount` son los locales de OpenStreetMap en el radio más los que solo trajo Google. `averageRating` es `null` si ningún local tiene calificaciones.
- Si Google falla (por ejemplo, cuota diaria agotada) el endpoint responde con error: no se muestran datos inventados. Solo sin `GOOGLE_PLACES_API_KEY` se usan datos de desarrollo.

#### Parámetros de consulta (Query Params)

| Parámetro     | Tipo     | Requerido | Default       | Descripción / Restricciones |
| ------------- | -------- | :-------: | :-----------: | --------------------------- |
| `lat`         | `number` | Sí        | —             | Latitud en grados decimales (`-90` a `90`). Ej: `-34.5880`. |
| `lng`         | `number` | Sí        | —             | Longitud en grados decimales (`-180` a `180`). Ej: `-58.4300`. |
| `radius`      | `number` | No        | `1000`        | Radio en metros (`10` a `20000`). Ej: `1000`. |
| `category`    | `string` | No        | según rubro   | Código de la categoría (`gastronomia`, `fitness`). |
| `subcategory` | `string` | No        | `restaurante` | Código del rubro (`restaurante`, `cafeteria`, `gimnasio`, `pilates`). |
| `match`       | `string` | No        | —             | Respuesta que define la competencia directa, como `pregunta:opción`. Ej: `cuisine_type:asian`. |

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
  "listMode": "general",
  "cuisineLabel": null,
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
      },
      "source": "google",
      "strength": 4.396
    }
  ]
}
```

### `GET /api/accessibility`

Obtiene el análisis de conectividad y transporte público (estaciones de subte, tren y paradas de colectivos) en un radio alrededor de unas coordenadas, con los datos de OpenStreetMap de `osm_data.transit_stops` (gratis, ver "Transporte de OpenStreetMap"). Cada parada o estación cuenta una vez aunque OSM la tenga en varios puntos (una por vereda, un andén por línea), trae las líneas que paran ahí (`lines`) y su ubicación (para la capa "Transporte" del mapa). `busLineCount` es la cantidad de líneas de colectivo distintas del radio y `updatedAt` la fecha de la última carga de OSM. **Requiere sesión** (`requireAuth`).

#### Parámetros de consulta (Query Params)

| Parámetro | Tipo     | Requerido | Default | Descripción / Restricciones |
| --------- | -------- | :-------: | :-----: | --------------------------- |
| `lat`     | `number` | Sí        | —       | Latitud en grados decimales (`-90` a `90`). Ej: `-34.5880`. |
| `lng`     | `number` | Sí        | —       | Longitud en grados decimales (`-180` a `180`). Ej: `-58.4300`. |
| `radius`  | `number` | No        | `1000`  | Radio en metros (`10` a `20000`). Ej: `1000`. |

#### Ejemplo de solicitud y respuesta

```http
GET /api/accessibility?lat=-34.5880&lng=-58.4300&radius=1000 HTTP/1.1
Host: localhost:8080
```

```json
{
  "total": 17,
  "subwayCount": 1,
  "trainCount": 0,
  "busCount": 16,
  "busLineCount": 26,
  "otherCount": 0,
  "level": "alta",
  "callout": "Excelente conectividad con subte a 51 m más 16 paradas de colectivo en la zona.",
  "source": "OpenStreetMap",
  "updatedAt": "2026-10-27T05:10:00.000Z",
  "places": [
    {
      "id": "transit-2841",
      "name": "Plaza Italia",
      "cleanName": "Est. Plaza Italia",
      "category": "subway",
      "type": "Subte",
      "lines": "Línea D",
      "lineCount": 1,
      "distanceMeters": 51,
      "distanceText": "51 m",
      "location": {
        "lat": -34.58138,
        "lng": -58.42103
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
  "source": "Perfil horario típico del rubro en CABA · estimado · no se mide en este punto"
}
```

### `GET /api/rentals`

Calcula el precio promedio y mediana de alquiler de locales comerciales, el valor por m² (en ARS y USD unificados según DolarAPI Oficial) y la lista de locales disponibles dentro de un radio de influencia en CABA.

`pricedInRadius` es la cantidad de avisos con precio, que son los que entran en el promedio y la mediana en pesos (los publicados solo en dólares se convierten con el tipo de cambio oficial). Si no hay avisos cargados (tabla vacía y sin el JSON local) o la DB no responde, devuelve **503** con un mensaje en vez de 0 locales.

#### Parámetros de consulta (Query Params)

| Parámetro | Tipo     | Requerido | Default | Descripción / Restricciones |
| --------- | -------- | :-------: | :-----: | --------------------------- |
| `lat`     | `number` | Sí        | —       | Latitud en grados decimales (`-90` a `90`). Ej: `-34.5880`. |
| `lng`     | `number` | Sí        | —       | Longitud en grados decimales (`-180` a `180`). Ej: `-58.4300`. |
| `radius`  | `number` | No        | `1000`  | Radio de búsqueda en metros (`10` a `20000`). Ej: `1000`. |

#### Ejemplo de solicitud y respuesta

```http
GET /api/rentals?lat=-34.5880&lng=-58.4300&radius=1000 HTTP/1.1
Host: localhost:8080
```

```json
{
  "center": { "lat": -34.5880, "lng": -58.4300 },
  "radiusInMeters": 1000,
  "totalInRadius": 203,
  "pricedInRadius": 198,
  "averageRentArs": 6437841,
  "medianRentArs": 5390000,
  "averageRentUsd": 4180,
  "medianRentUsd": 3500,
  "averagePricePerM2Ars": 34630,
  "medianPricePerM2Ars": 30030,
  "averagePricePerM2Usd": 22.49,
  "medianPricePerM2Usd": 19.50,
  "averageSurfaceM2": 186,
  "minRentArs": 500000,
  "maxRentArs": 38500000,
  "neighborhoods": ["Palermo", "Palermo Hollywood", "Palermo Soho", "Villa Crespo"],
  "callout": "Zona comercial consolidada con alta oferta (203 locales disponibles). Valor medio de referencia: $34.630/m².",
  "places": [
    {
      "id": "60284104",
      "address": "Antezana 500",
      "neighborhood": "Villa Crespo",
      "priceArs": 500000,
      "priceUsd": 324.68,
      "surfaceM2": 27,
      "pricePerM2Ars": 18518.52,
      "distanceMeters": 180,
      "distanceText": "180 m",
      "url": "https://www.zonaprop.com.ar/propiedades/..."
    }
  ]
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
`npm run db:seed:census` carga en la base datos iniciales radiales para calcular la densidad poblacional y demografía. Los datos se cargan desde `src\db\seeders\data\caba_census_radios.geojson` (descargado desde `https://cdn.buenosaires.gob.ar/datosabiertos/datasets/informacion-censal-por-radio/CABA_rc.geojson` y enriquecido con los Indicadores 182, 514 y 174 del Censo 2022 del Geoportal INDEC mediante `node scripts/fetch-indec-demographics.js`).

|Variable|Tipo|Significado|
|--------|----|-----------|
RADIO_ID|	Código oficial|	Clave jerárquica del INDEC: Comuna_Fracción_Radio (ej: 14_3_12).|
BARRIO|	Nombre|	Uno de los 48 barrios oficiales de CABA.|
COMUNA|	1 a 15|	Comuna política a la que pertenece el radio.|
POBLACION|	Conteo real|	Cantidad exacta de personas censadas en esas manzanas.|
VIVIENDAS|	Conteo real|	Total de unidades habitacionales particulares y colectivas.|
HOGARES|	Conteo real|	Total de hogares censados en el radio.|
HOGARES_NBI|	Indicador| INDEC	Hogares con Necesidades Básicas Insatisfechas (mide hacinamiento, calidad de vivienda, saneamiento y escolaridad).|
EDAD_0_14|	Conteo estimado|	Población de 0 a 14 años en el radio (`kids`, INDEC Censo 2022).|
EDAD_15_34|	Conteo estimado|	Población de 15 a 34 años en el radio (`young`, INDEC Censo 2022).|
EDAD_35_59|	Conteo estimado|	Población de 35 a 59 años en el radio (`adults`, INDEC Censo 2022).|
EDAD_60_MAS|	Conteo estimado|	Población de 60 años y más en el radio (`seniors`, INDEC Censo 2022).|
MUJERES|	Conteo estimado|	Población femenina en el radio (INDEC Censo 2022 Indicador 174).|
VARONES|	Conteo estimado|	Población masculina en el radio (INDEC Censo 2022 Indicador 174).|
AREA_KM2|	Geometría|Superficie real del polígono calculada por la cartografía oficial.|
geometry|	MultiPolygon|	Coordenadas vectoriales exactas de los límites de las manzanas en WGS84.|

### Locales Comerciales (seed)

`npm run db:seed:rentals` carga en `commercial_data.commercial_rentals` los 3.800 locales comerciales en alquiler relevados en CABA, georreferenciados mediante la API oficial del GCBA (USIG) y con precios unificados a Dólar Oficial vía DolarAPI. Se crea un índice espacial (`IX_commercial_rentals_geom`) que permite calcular precios de mercado por radio en milisegundos.

| Variable | Tipo | Significado |
| -------- | ---- | ----------- |
| `source_id` | `varchar(50)` | Identificador único de la publicación de Zonaprop. |
| `address` | `nvarchar(255)` | Dirección original de la publicación. |
| `normalized_address` | `nvarchar(255)` | Dirección normalizada oficial por el Gobierno de la Ciudad (USIG). |
| `neighborhood` | `nvarchar(100)` | Barrio oficial o zona comercial en CABA. |
| `price_ars` | `decimal(14,2)` | Precio mensual de alquiler expresado en Pesos Argentinos (ARS). |
| `price_usd` | `decimal(14,2)` | Precio mensual de alquiler expresado en Dólares Estadounidenses (USD). |
| `surface_m2` | `decimal(10,2)` | Superficie total o cubierta en metros cuadrados. |
| `price_per_m2_ars` | `decimal(14,2)` | Valor locativo mensual por metro cuadrado en ARS. |
| `price_per_m2_usd` | `decimal(14,2)` | Valor locativo mensual por metro cuadrado en USD. |
| `geom` | `geography` | Coordenadas vectoriales puntuales WGS84 (`Point(lat, lng, 4326)`). |

### Negocios de OpenStreetMap (seed)

`npm run db:seed:osm-places` baja de Overpass (OpenStreetMap, gratis y sin clave) los restaurantes, locales de comida rápida, cafés, gimnasios y estudios de pilates del barrio disponible con 2 km de margen (el radio máximo del paso 3), y los guarda en `osm_data.places` con índice espacial (`IX_places_geom`). Los servidores públicos de Overpass suelen estar saturados: el script prueba varios espejos y reintenta. Es idempotente (actualiza por `osm_type` + `osm_id`) y no borra: los negocios que dejan de aparecer en OSM quedan con `is_active = 0`. Conviene correrlo cada tanto para refrescar los datos. Requiere el censo cargado.

| Variable | Tipo | Significado |
| -------- | ---- | ----------- |
| `osm_type` / `osm_id` | `char(1)` / `bigint` | Identificador del elemento en OSM (`n` nodo, `w` vía, `r` relación). |
| `kind` | `varchar(20)` | Tipo normalizado: `restaurant`, `fast_food`, `cafe`, `fitness` o `pilates`. |
| `name` | `nvarchar(200)` | Nombre del negocio (puede faltar). |
| `cuisine` | `varchar(200)` | Etiqueta `cuisine` de OSM (ej. `sushi;japanese`); en Palermo la tiene cerca del 38% de los restaurantes. |
| `geom` | `geography` | Punto del negocio (centro, si es un edificio). |
| `is_active` / `last_seen_at` | `bit` / `datetime2` | Si apareció en la última carga, y cuándo. |
| `details` | `nvarchar(max)` (JSON) | Datos para la ficha del local que tenga cargados en OSM: dirección, horarios, teléfono, web, redes y servicios (mesas afuera, delivery, take away, accesibilidad). |

Datos © colaboradores de OpenStreetMap, licencia ODbL: el mapa del front muestra la atribución.

### Transporte de OpenStreetMap (seed)

`npm run db:seed:osm-transit` baja de Overpass las paradas de colectivo (`highway=bus_stop` y andenes con `bus=yes`) y las estaciones de subte y tren (`railway=station|halt`) del barrio disponible con 2 km de margen, y las guarda en `osm_data.transit_stops` con índice espacial (`IX_transit_stops_geom`). Las líneas salen de los recorridos de OSM que pasan por cada parada: colectivos por número (los ramales "39-3" o "151C" cuentan como 39 y 151), subte por letra (tomada de los andenes de la estación) y tren por la red (`network`, ej. "San Martín"). Mismo comportamiento que el seed de negocios: idempotente, no borra (`is_active = 0`) y requiere el censo cargado.

| Variable | Tipo | Significado |
| -------- | ---- | ----------- |
| `osm_type` / `osm_id` | `char(1)` / `bigint` | Identificador del elemento en OSM. |
| `kind` | `varchar(10)` | `bus`, `subway` o `train`. |
| `name` | `nvarchar(200)` | Nombre de la parada (ej. "Honduras y Thames") o de la estación (puede faltar). |
| `lines` | `nvarchar(400)` | Líneas separadas por coma: "39,55,151", "D" o "San Martín". En Palermo la tiene más del 90% de las paradas. |
| `geom` | `geography` | Punto de la parada o estación. |
| `is_active` / `last_seen_at` | `bit` / `datetime2` | Si apareció en la última carga, y cuándo. |

OSM tiene un punto por vereda en cada esquina y uno por andén en las estaciones: el servicio de accesibilidad los junta (mismo tipo y nombre a menos de 80 m para colectivos y 300 m para estaciones) para contar cada parada una vez.

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
