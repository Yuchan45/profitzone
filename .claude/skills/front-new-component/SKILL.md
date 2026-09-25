---
name: front-new-component
description: Crea un componente React reutilizable en profit-zone-front con sus estilos BEM en index.css. Usar cuando se pida un componente, card, widget, tabla o elemento de UI reutilizable para el front.
---

# Nuevo componente en profit-zone-front

Argumento: nombre del componente en PascalCase (ej. `KpiCard`).

## Pasos

1. Revisar `profit-zone-front/src/components/` por si ya existe algo reutilizable o extensible.

2. Crear `profit-zone-front/src/components/<Nombre>.jsx` siguiendo `ApiStatus.jsx`:
   - `function KpiCard({ title, value }) { ... }` con props desestructuradas
   - `export default KpiCard` al final
   - constantes de textos/labels fuera del componente (como `LABELS` en `ApiStatus.jsx`)
   - si muestra montos o fechas, usar `formatCurrency` / `formatDate` de `src/utils/formatters.js`
   - si necesita datos de la API, recibirlos por props o usar un hook de `src/hooks/` (ver skill `front-new-endpoint`); no llamar a `api` desde el componente.

3. Agregar los estilos en `profit-zone-front/src/index.css` con clases BEM derivadas del nombre en kebab-case:
   - bloque: `.kpi-card`
   - elementos: `.kpi-card-title`, `.kpi-card-value`
   - modificadores: `.kpi-card--positive`, `.kpi-card--negative`

4. Correr `npm run lint` en `profit-zone-front/` y corregir cualquier error.
