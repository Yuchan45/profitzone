# profit-zone-back — convenciones

API REST en Node.js 20+ con Express 5, ESM (`"type": "module"`). JavaScript, sin TypeScript. Sin base de datos, linter ni tests por ahora.

## Estructura y capas

Flujo de una request: `routes/` → `controllers/` → `services/`.

- **routes/**: `src/routes/<recurso>.routes.js` crea un `Router`, mapea verbos a controllers y hace `export default router`. Se monta en `src/routes/index.js` con `router.use('/<recurso>', <recurso>Routes)`. Todo cuelga de `/api` (ver `src/app.js`).
- **controllers/**: `src/controllers/<recurso>.controller.js` con funciones nombradas exportadas (`export function getX(req, res)`). Leen `req`, llaman al service y responden con `res.json(...)` o `res.status(201).json(...)`. Sin lógica de negocio. (`health.controller.js` es una excepción: responde datos de configuración sin service. El patrón completo está en la skill `back-new-resource`.)
- **services/**: `src/services/<recurso>.service.js` con la lógica de negocio y el acceso a datos.
- **utils/**: helpers sin estado.
- Imports relativos con extensión `.js` explícita.

## Errores

- Express 5 manda al `errorHandler` tanto los `throw` síncronos como los rechazos de funciones `async`: en los controllers no hace falta `try/catch` ni `next(err)`.
- Para errores esperados, lanzar un `Error` con propiedad `status` (400, 404, 409, 422...). `src/middlewares/errorHandler.js` usa `err.status` y responde `{ status: 'error', message }`. En producción oculta el mensaje de los 5xx.
- Rutas inexistentes: `src/middlewares/notFound.js` (404).

## Configuración

- Toda variable de entorno se declara en el `schema` de `src/config/env.js` (con `required`, `default`, `parse`, `validate` y `message`) y se expone en camelCase en el objeto `env` congelado. Nunca leer `process.env` fuera de ese archivo.
- Cada variable nueva también va en `.env.example` y en la tabla "Variables de entorno" de **los dos** README: `profit-zone-back/README.md` y el `README.md` raíz.
- CORS se configura solo en `src/config/cors.js` a partir de `CORS_ORIGINS`. No usar `*`.

## Estilo

- Mensajes de error, logs y comentarios en español. Los logs llevan el prefijo `[ProfitZone]`.
- Respuestas JSON en camelCase.
- Al agregar un endpoint, actualizar la tabla "Endpoints" de **los dos** README: `profit-zone-back/README.md` y el `README.md` raíz.
- El front (`profit-zone-front`) consume la API con Axios y muestra `error.response.data.message`, así que los mensajes de error deben ser legibles para el usuario.

## Validación

No hay tests todavía. Para verificar un cambio se usa el smoke test (`scripts/smoke.js`), desde `profit-zone-back/`. Levanta la API en el puerto 8081, espera a que responda `/api/health`, prueba las rutas pedidas y la apaga. Funciona en Windows y no deja procesos colgados.

```bash
npm run smoke                                        # solo /api/health
npm run smoke -- /api/ventas /api/ventas/99          # GET a cada ruta
npm run smoke -- POST /api/ventas '{"monto":100}'    # método + body JSON (Git Bash)
npm run smoke -- POST /api/ventas @body.json         # body desde archivo (cualquier shell)
```

- Devuelve código de salida 1 si la API no arranca (y muestra el error de arranque), si una ruta no responde en 5 s o si los argumentos son inválidos. Los códigos HTTP de cada ruta (200, 404, 400...) se imprimen para compararlos con lo esperado.
- Si el puerto 8081 está ocupado, falla antes de levantar la API, para no probar otro proceso por error. Se puede usar otro puerto con `SMOKE_PORT=8090`.
- En PowerShell 5.1 las comillas del JSON se pierden: hay que escaparlas (`'{\"monto\":100}'`) o usar `@archivo.json`.
- Es la única receta de validación del back: las skills y los agentes remiten a esta sección.
- `scripts/` son herramientas de desarrollo y no forman parte de la API: pueden leer `process.env` directamente.
