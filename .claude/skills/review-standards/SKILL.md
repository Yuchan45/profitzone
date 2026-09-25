---
name: review-standards
description: Revisa si un diff respeta los estándares documentados de ProfitZone (profit-zone-front/CLAUDE.md y profit-zone-back/CLAUDE.md) y detecta code smells de Fowler. Usar para revisar convenciones y diseño de cambios antes de pushear o mergear. No busca bugs: para eso está /code-review.
---

# Revisión de estándares

Adaptado del eje "Standards" de [mattpocock/skills@code-review](https://github.com/mattpocock/skills) (MIT).

Argumento: rango a revisar (ej. `origin/main...HEAD`). Si no se indica, usar `@{u}...HEAD` y, si no hay upstream, `origin/main...HEAD`.

## Pasos

1. **Obtener el diff.** Correr `git diff --stat <rango>` y `git diff <rango>`. Si está vacío, informarlo y terminar.

2. **Juntar los estándares aplicables** según los archivos tocados:
   - `profit-zone-front/**` → `profit-zone-front/CLAUDE.md`
   - `profit-zone-back/**` → `profit-zone-back/CLAUDE.md`
   - `.claude/**` → `.claude/README.md` (tablas de skills al día, skills con `name` y `description`)
   - README raíz o de cada app: si se agregó un endpoint, script o variable de entorno, ¿se actualizó su tabla?

3. **Delegar la revisión a un subagente** (`general-purpose`) para no llenar el contexto principal. Pasarle:
   - el comando del diff,
   - el contenido de los `CLAUDE.md` aplicables,
   - la lista de smells de abajo, completa,
   - esta consigna: "Reportá por archivo/hunk: (a) cada violación de un estándar documentado, citando el archivo y la regla; (b) cada smell de la lista, nombrándolo y citando el hunk. Separá las violaciones duras de los criterios opinables. Ignorá lo que ya valida el linter. Máximo 400 palabras, en español."

4. **Reportar** con este formato:

   ```
   ## Estándares
   ### Violaciones (duras)
   - archivo:línea: regla de CLAUDE.md → qué hacer
   ### Smells (opinables)
   - archivo:línea: posible <smell> → sugerencia
   Resumen: N violaciones, M smells. Lo más grave: ...
   ```

## Reglas

- **Gana el repo.** Si un `CLAUDE.md` avala algo que un smell marcaría, no se reporta.
- **Los smells son siempre opinables:** "posible Feature Envy", nunca "violación".
- Solo se revisa lo que cambió en el diff, no el código que ya existía.

## Smells (Fowler, *Refactoring*, cap. 3)

- **Nombre misterioso**: función o variable cuyo nombre no dice qué hace. → Renombrar.
- **Código duplicado**: la misma lógica en más de un hunk o archivo. → Extraer y reutilizar (por ejemplo, un helper en `utils/` o un hook).
- **Feature Envy**: una función que usa más datos de otro módulo que del propio. → Moverla junto a esos datos.
- **Data Clumps**: los mismos parámetros viajan siempre juntos. → Agruparlos en un objeto.
- **Obsesión por primitivos**: strings o números sueltos en lugar de un concepto del dominio (estados mágicos, montos sin formato). → Constante, enum u objeto.
- **Switches repetidos**: el mismo `switch`/`if` sobre el mismo valor en varios lugares. → Un mapa compartido (como `LABELS` en `ApiStatus.jsx`).
- **Cirugía de escopeta**: un cambio lógico obliga a tocar muchos archivos dispersos. → Agrupar lo que cambia junto.
- **Cambio divergente**: un archivo se modifica por razones no relacionadas. → Separar responsabilidades.
- **Generalidad especulativa**: abstracciones o parámetros para necesidades que nadie pidió. → Borrar hasta que haga falta.
- **Cadenas de mensajes**: `a.b().c().d()` que el llamador no debería conocer. → Encapsular.
- **Intermediario**: una función que solo delega a otra. → Llamar directo al destino.
- **Capa salteada** (específico de ProfitZone): un componente que llama a `api` sin pasar por un service, o un controller con lógica de negocio. → Respetar las capas de cada `CLAUDE.md`.
