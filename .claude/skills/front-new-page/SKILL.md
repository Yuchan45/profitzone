---
name: front-new-page
description: Crea una nueva página ruteada en profit-zone-front (carpeta en src/pages, ruta en App.jsx dentro del template que corresponda y link en la Navbar), armada con componentes de atomic design. Usar cuando se pida agregar una pantalla, vista o sección nueva al front.
---

# Nueva página en profit-zone-front

Argumento: nombre de la página en PascalCase (ej. `Reportes`). Si no se indica ruta, usar el nombre en minúsculas (`/reportes`).

Leé antes la sección "Atomic design" de `profit-zone-front/CLAUDE.md`.

## Pasos

1. Crear `profit-zone-front/src/pages/<Nombre>/<Nombre>.jsx` y, si tiene estilos propios, `<Nombre>.css` al lado. Ejemplo a copiar: `src/pages/Rubro/Rubro.jsx`.

   ```jsx
   import './Reportes.css'

   function Reportes() {
     return (
       <section className="reportes">
         <h1 className="reportes-title">Reportes</h1>
         <p>...</p>
       </section>
     )
   }

   export default Reportes
   ```

   - La página compone organisms, molecules y atoms de `src/components/`. Antes de escribir markup nuevo, revisar si ya existe el componente (Button, Chip, CategoryCard, Stepper…).
   - Si un bloque se va a repetir o es una pieza de UI genérica, extraerlo como componente con la skill `front-new-component` en vez de dejarlo en la página.
   - El `.css` de la página solo tiene el layout de la página y usa tokens de `src/styles/tokens.css`.

2. En `profit-zone-front/src/App.jsx`:
   - importar la página: `import Reportes from './pages/Reportes/Reportes.jsx'`
   - agregar `<Route path="/reportes" element={<Reportes />} />` dentro del template que corresponda, **antes** de la ruta `*`:
     - `MainLayout` (Navbar + Footer) para páginas generales.
     - `FlowLayout` (Header simple) para los pasos del flujo de análisis (`/analizar/...`).
     - Si ninguno sirve, crear un template nuevo en `src/components/templates/`.

3. Si la página debe estar en el menú, agregar en `profit-zone-front/src/components/organisms/Navbar/Navbar.jsx`:
   `<NavLink to="/reportes">Reportes</NavLink>`

4. Si la página necesita datos de la API, usar la skill `front-new-endpoint` para crear el servicio y el hook; no llamar a `api` directamente desde la página.

5. Validar según "Validación" en `profit-zone-front/CLAUDE.md` (`npm run lint` y `npm run build`) y corregir cualquier error.
