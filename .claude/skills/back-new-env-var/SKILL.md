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

6. **README** — agregar la fila a la tabla "Variables de entorno" de `profit-zone-back/README.md` (Obligatoria / Default / Descripción).

7. **Verificar**:
   - arranca con la variable definida: `PORT=8081 node src/server.js` y `curl http://localhost:8081/api/health`
   - si es obligatoria, sin la variable el proceso tiene que fallar con el mensaje del schema.
