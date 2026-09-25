---
name: front-new-endpoint
description: Conecta profit-zone-front con un endpoint de la API creando la función de servicio (Axios) y un custom hook con estado loading/ok/error. Usar cuando se pida consumir, traer o mostrar datos de un endpoint del backend.
---

# Consumir un endpoint de la API

Argumento: método y ruta del endpoint (ej. `GET /ventas`).

## Pasos

1. **Confirmar la respuesta.** Si existe, leer la ruta correspondiente en `profit-zone-back/src` para conocer la forma del JSON. Si no existe todavía, avisarlo y asumir una forma razonable.

2. **Servicio.** Crear o extender `profit-zone-front/src/services/<dominio>.service.js` siguiendo `health.service.js`:

   ```js
   import api from './api.js'

   export async function fetchVentas(params) {
     const { data } = await api.get('/ventas', { params })
     return data
   }
   ```

   - Siempre usar la instancia `api` (ya maneja baseURL y token). Nunca `axios` directo ni URLs absolutas.
   - Para escritura: `api.post`, `api.put`, `api.delete`, devolviendo `data`.

3. **Hook (solo lecturas).** Crear `profit-zone-front/src/hooks/use<Dominio>.js` copiando el patrón de `useHealth.js`:
   - estado inicial `{ status: 'loading', data: null, error: null }`
   - flag `cancelled` en el cleanup del `useEffect`
   - error: `error.response?.data?.message ?? error.message`
   - si recibe parámetros, que sean **primitivos** (`useVentas(mes, anio)`, no `useVentas({ mes, anio })`) y van en el array de dependencias del `useEffect`. Un objeto o array creado en el render es nuevo en cada render: el efecto se volvería a ejecutar, actualizaría el estado y dispararía requests infinitos. Si el filtro tiene que ser un objeto, el componente lo memoiza con `useMemo`.

4. **Uso en UI.** En el componente, renderizar los tres estados (`loading`, `ok`, `error`). Formatear montos y fechas con `formatCurrency` / `formatDate` de `src/utils/formatters.js`.

5. Validar según "Validación" en `profit-zone-front/CLAUDE.md` (`npm run lint` y `npm run build`) y corregir cualquier error.
