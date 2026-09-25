---
name: back-new-resource
description: Crea un recurso o endpoint nuevo en profit-zone-back (routes + controller + service, montado en /api) y actualiza el README. Usar cuando se pida agregar un endpoint, una ruta o un CRUD a la API.
---

# Nuevo recurso en profit-zone-back

Argumento: nombre del recurso en plural y minúsculas, y opcionalmente las operaciones (ej. `ventas`, o `ventas GET POST`). Sin operaciones: `GET /` (listar) y `GET /:id`.

## Pasos

1. **Diseño.** Definir las rutas REST: sustantivos en plural, `GET` para leer, `POST` para crear (201), `PUT`/`PATCH` para actualizar, `DELETE` para borrar (204). Ante dudas de diseño, cargar la skill `api-design-principles`.

2. **Service** — `profit-zone-back/src/services/<recurso>.service.js`:

   ```js
   export async function listVentas() {
     // acceso a datos / lógica de negocio
   }

   export async function getVenta(id) {
     const venta = /* ... */ null
     if (!venta) {
       const error = new Error(`Venta ${id} no encontrada`)
       error.status = 404
       throw error
     }
     return venta
   }
   ```

   Si todavía no hay base de datos, usar un array en memoria dentro del service y avisarlo en el reporte final.

3. **Controller** — `profit-zone-back/src/controllers/<recurso>.controller.js`, siguiendo `health.controller.js`:

   ```js
   import { listVentas, getVenta } from '../services/ventas.service.js'

   export async function getVentas(req, res) {
     res.json(await listVentas())
   }

   export async function getVentaById(req, res) {
     res.json(await getVenta(req.params.id))
   }
   ```

   Sin `try/catch`: Express 5 manda los rechazos de funciones `async` al `errorHandler`.

4. **Validación de entrada.** En `POST`/`PUT`/`PATCH`, validar `req.body` en el controller antes de llamar al service. Si es inválido, lanzar un `Error` con `status = 400` y un mensaje claro en español. No agregar librerías de validación sin permiso. Si el endpoint recibe datos sensibles, cargar la skill `security-and-hardening`.

5. **Router** — `profit-zone-back/src/routes/<recurso>.routes.js`, siguiendo `health.routes.js`, y montarlo en `src/routes/index.js`:

   ```js
   import ventasRoutes from './ventas.routes.js'
   router.use('/ventas', ventasRoutes)
   ```

6. **README.** Agregar las filas nuevas a la tabla "Endpoints" de **los dos** README: `profit-zone-back/README.md` y el `README.md` raíz.

7. **Verificar** con el smoke test (ver "Validación" en `profit-zone-back/CLAUDE.md`), probando el caso feliz, un 404 y, si aplica, un 400. Por ejemplo:
   `npm run smoke -- /api/ventas /api/ventas/no-existe POST /api/ventas '{}'`

8. Si el front va a consumir el endpoint, sugerir la skill `front-new-endpoint`.
