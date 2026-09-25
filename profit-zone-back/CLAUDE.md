# profit-zone-back — convenciones

API REST en Node.js 20+ con Express 5, ESM (`"type": "module"`). JavaScript, sin TypeScript. Sin base de datos, linter ni tests por ahora.

## Estructura y capas

Flujo de una request: `routes/` → `controllers/` → `services/`.

- **routes/**: `src/routes/<recurso>.routes.js` crea un `Router`, mapea verbos a controllers y hace `export default router`. Se monta en `src/routes/index.js` con `router.use('/<recurso>', <recurso>Routes)`. Todo cuelga de `/api` (ver `src/app.js`).
- **controllers/**: `src/controllers/<recurso>.controller.js` con funciones nombradas exportadas (`export function getX(req, res)`). Leen `req`, llaman al service y responden con `res.json(...)` o `res.status(201).json(...)`. Sin lógica de negocio.
- **services/**: `src/services/<recurso>.service.js` con la lógica de negocio y el acceso a datos.
- **utils/**: helpers sin estado.
- Imports relativos con extensión `.js` explícita.

## Errores

- Express 5 propaga solo los errores de funciones `async` al `errorHandler`: no hace falta `try/catch` ni `next(err)` para eso.
- Para errores esperados, lanzar un `Error` con propiedad `status` (400, 404, 409, 422...). `src/middlewares/errorHandler.js` usa `err.status` y responde `{ status: 'error', message }`. En producción oculta el mensaje de los 5xx.
- Rutas inexistentes: `src/middlewares/notFound.js` (404).

## Configuración

- Toda variable de entorno se declara en el `schema` de `src/config/env.js` (con `required`, `default`, `parse`, `validate` y `message`) y se expone en camelCase en el objeto `env` congelado. Nunca leer `process.env` fuera de ese archivo.
- Cada variable nueva también va en `.env.example` y en la tabla del `README.md`.
- CORS se configura solo en `src/config/cors.js` a partir de `CORS_ORIGINS`. No usar `*`.

## Estilo

- Mensajes de error, logs y comentarios en español. Los logs llevan el prefijo `[ProfitZone]`.
- Respuestas JSON en camelCase.
- Al agregar un endpoint, actualizar la tabla de Endpoints del `README.md`.
- El front (`profit-zone-front`) consume la API con Axios y muestra `error.response.data.message`, así que los mensajes de error deben ser legibles para el usuario.

## Validación

No hay tests todavía. Para verificar un cambio, levantar la API en otro puerto y probarla con curl:

```bash
PORT=8081 CORS_ORIGINS=http://localhost:5173 node src/server.js &
curl -s http://localhost:8081/api/<ruta>
kill %1
```
