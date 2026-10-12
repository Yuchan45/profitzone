---
name: front-new-component
description: Crea un componente React reutilizable en profit-zone-front siguiendo atomic design (atoms, molecules, organisms, templates), en su propia carpeta con su .css BEM y los tokens de diseño. Usar cuando se pida un componente, card, widget, tabla, layout o elemento de UI reutilizable para el front.
---

# Nuevo componente en profit-zone-front

Argumento: nombre del componente en PascalCase (ej. `KpiCard`).

Leé antes las secciones "Atomic design" y "Estilos y formato" de `profit-zone-front/CLAUDE.md`.

## Pasos

1. **Buscar si ya existe.** Revisar `profit-zone-front/src/components/{atoms,molecules,organisms,templates}/`. Si hay algo parecido, preferir extenderlo con una prop o variante en vez de crear uno nuevo.

2. **Elegir el nivel:**
   - `atoms`: no se puede dividir en algo útil (botón, chip, ícono, badge, input).
   - `molecules`: combina 2 o más atoms para una tarea puntual (card, campo con label, ítem de lista).
   - `organisms`: bloque autónomo de la pantalla (header, stepper, tabla, formulario completo).
   - `templates`: estructura de página que renderiza `<Outlet />`.

   Regla de imports: solo se importan niveles inferiores. Atoms y molecules no usan hooks de datos; reciben todo por props.

3. **Crear** `profit-zone-front/src/components/<nivel>/<Nombre>/<Nombre>.jsx`. Ejemplos a copiar: `atoms/Button/Button.jsx` (variantes por props) y `molecules/CategoryCard/CategoryCard.jsx` (composición de atoms).
   - `function KpiCard({ title, value }) { ... }` con props desestructuradas y `export default KpiCard` al final.
   - Importar su CSS al final de los imports: `import './KpiCard.css'`.
   - Las constantes de textos o labels van fuera del componente (como `LABELS` en `molecules/ApiStatus/ApiStatus.jsx`).
   - Si muestra montos o fechas, usar `formatCurrency` / `formatDate` de `src/utils/formatters.js`.
   - Si necesita datos de la API, recibirlos por props, o usar un hook de `src/hooks/` desde un organism o una page (ver skill `front-new-endpoint`). Nunca llamar a `api` desde el componente.
   - Íconos: usar el atom `Icon` (`<Icon name="store" />`). Si falta uno, agregar sus paths de lucide al mapa `PATHS` de `atoms/Icon/Icon.jsx`, sin instalar librerías.
   - Elementos interactivos accesibles: `<button type="button">` y `aria-pressed` o `aria-current` cuando corresponda.

4. **Crear** `<Nombre>.css` en la misma carpeta, con clases BEM derivadas del nombre en kebab-case:
   - bloque: `.kpi-card`
   - elementos: `.kpi-card-title`, `.kpi-card-value`
   - modificadores: `.kpi-card--positive`, `.kpi-card--negative`

   Solo se usan tokens de `src/styles/tokens.css` (`var(--color-…)`, `var(--space-…)`, `var(--radius-…)`, `var(--text-…)`, `var(--font-heading)`), sin hex sueltos. Si falta un color del Figma, agregarlo primero a `tokens.css`.

5. Validar según "Validación" en `profit-zone-front/CLAUDE.md` (`npm run lint` y `npm run build`) y corregir cualquier error.
