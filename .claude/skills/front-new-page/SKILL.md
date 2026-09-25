---
name: front-new-page
description: Crea una nueva página ruteada en profit-zone-front (archivo en src/pages, ruta en App.jsx y link en la Navbar). Usar cuando se pida agregar una pantalla, vista o sección nueva al front.
---

# Nueva página en profit-zone-front

Argumento: nombre de la página en PascalCase (ej. `Reportes`). Si no se indica ruta, usar el nombre en minúsculas (`/reportes`).

## Pasos

1. Crear `profit-zone-front/src/pages/<Nombre>.jsx` siguiendo `src/pages/Dashboard.jsx`:

   ```jsx
   function Reportes() {
     return (
       <section>
         <h1>Reportes</h1>
         <p>...</p>
       </section>
     )
   }

   export default Reportes
   ```

2. En `profit-zone-front/src/App.jsx`:
   - importar la página: `import Reportes from './pages/Reportes.jsx'`
   - agregar `<Route path="/reportes" element={<Reportes />} />` dentro del `<Route element={<MainLayout />}>`, **antes** de la ruta `*`.

3. Si la página debe estar en el menú, agregar en `profit-zone-front/src/components/Navbar.jsx`:
   `<NavLink to="/reportes">Reportes</NavLink>`

4. Si la página necesita datos de la API, usar la skill `front-new-endpoint` para crear el servicio y el hook; no llamar a `api` directamente desde la página.

5. Validar según "Validación" en `profit-zone-front/CLAUDE.md` (`npm run lint` y `npm run build`) y corregir cualquier error.
