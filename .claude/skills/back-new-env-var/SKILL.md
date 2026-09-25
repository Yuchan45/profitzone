---
name: back-new-env-var
description: Agrega una variable de entorno a profit-zone-back con validación al arranque (schema de src/config/env.js), .env.example y README. Usar cuando se necesite una nueva configuración, secreto, URL de base de datos, puerto, clave de API o flag del backend.
---

# Nueva variable de entorno en profit-zone-back

Argumento: nombre de la variable en MAYÚSCULAS (ej. `JWT_SECRET`) y para qué sirve.

## Pasos

1. **Schema** — agregar la entrada en el objeto `schema` de `profit-zone-back/src/config/env.js`, siguiendo `PORT` y `CORS_ORIGINS`:

   ```js
   JWT_SECRET: {
     required: true,
     validate: (value) => value.length >= 32,
     message: 'debe tener al menos 32 caracteres',
   },
   ```

   - `required: true` si la app no puede funcionar sin ella; si no, `required: false` con un `default` string.
   - `parse` para convertir el tipo (`Number`, split por comas, `value === 'true'`).
   - `message` en español, explicando qué valor se espera.

2. **Exponerla** en el `Object.freeze({...})` de `loadEnv()` con nombre camelCase (`jwtSecret: config.JWT_SECRET`).

3. **Usarla** siempre importando `env` desde `src/config/env.js`. Nunca con `process.env.X` en otro archivo.

4. **`.env.example`** — agregarla con un comentario de una línea arriba. Si es un secreto, poner un placeholder (`JWT_SECRET=cambiar-por-un-valor-aleatorio-de-32-caracteres`), nunca un valor real.

5. **`.env` local** — si existe, agregarle un valor de desarrollo para que la API siga arrancando. `.env` está en `.gitignore`: no se commitea.

6. **README** — agregar la fila a la tabla "Variables de entorno" de **los dos** README: `profit-zone-back/README.md` y el `README.md` raíz (Obligatoria / Default / Descripción).

7. **Verificar** desde `profit-zone-back/`:
   - Arranca con la variable definida: `npm run smoke` (ver "Validación" en `profit-zone-back/CLAUDE.md`).
   - Si es obligatoria, sin ella el arranque tiene que fallar. Como `dotenv` no pisa una variable que ya existe en el entorno, se la vacía explícitamente para que `.env` no la aporte: `JWT_SECRET= npm run smoke`. Tiene que salir con código 1 y mostrar `- JWT_SECRET: es obligatoria y no está definida`.
   - Si tiene `validate`, con un valor inválido (`JWT_SECRET=corto npm run smoke`) tiene que fallar mostrando el `message` del schema.
