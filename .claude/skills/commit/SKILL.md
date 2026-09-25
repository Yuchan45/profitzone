---
name: commit
description: Crea commits de git en ProfitZone siguiendo Conventional Commits con scope obligatorio, "tipo(scope): descripción" (ej. "feat(front): add sales page"). Usar siempre que el usuario pida commitear, hacer un commit, guardar los cambios en git o armar el mensaje de un commit.
---

# Commits en ProfitZone

Formato obligatorio para todo commit que haga Claude:

```
<tipo>(<scope>): <descripción>

[cuerpo opcional: el porqué del cambio]

[footer opcional: BREAKING CHANGE: ..., Closes #12]
```

## Tipos

| Tipo       | Cuándo |
| ---------- | ------ |
| `feat`     | Funcionalidad nueva para el usuario o la API |
| `fix`      | Corrección de un bug |
| `refactor` | Cambio de código que no altera el comportamiento |
| `style`    | Formato o estilos visuales (CSS) sin cambio de lógica |
| `docs`     | Solo documentación (README, CLAUDE.md, comentarios) |
| `test`     | Agregar o corregir tests |
| `perf`     | Mejora de rendimiento |
| `build`    | Dependencias, `package.json`, configuración de Vite |
| `ci`       | Pipelines de CI/CD |
| `chore`    | Mantenimiento que no entra en los anteriores (por ejemplo `.gitignore`) |
| `revert`   | Revertir un commit anterior |

## Scopes

En minúscula. Usar el área afectada:

- `front`, `back`: cambios generales de una app
- una parte concreta, cuando está clara: `auth`, `dashboard`, `health`, `navbar`, `env`, `cors`...
- `claude`: agentes, skills y hooks en `.claude/`
- `readme`, `deps`, `repo`: documentación general, dependencias, estructura del monorepo

Si un cambio toca front y back por la misma feature, usar el scope de la feature (`feat(auth): ...`) y no dos commits artificiales.

## Descripción

- En inglés, en imperativo y en minúscula: `add`, `fix`, `remove`. No `added`, `Adds` ni `Added`.
- Máximo 72 caracteres en toda la primera línea. Sin punto final.
- Dice **qué** cambia. El **porqué** va en el cuerpo si no es obvio.

## Pasos

1. `git status` y `git diff` (y `git diff --staged`) para ver qué cambió.
2. **Separar si hace falta.** Si hay cambios de propósitos distintos (una feature y un fix no relacionado), proponer varios commits y stagear por archivo (`git add <archivos>`). Nunca `git add -A` a ciegas: revisar que no entren `.env`, `dist/` ni `node_modules/`.
3. Elegir tipo y scope según las tablas y redactar el mensaje.
4. Commitear con heredoc para respetar los saltos de línea:

   ```bash
   git commit -m "$(cat <<'EOF'
   feat(back): add sales endpoint

   Lists sales from the in-memory service until the DB is chosen.
   EOF
   )"
   ```

5. Antes de ejecutar, verificar: tipo válido, scope en minúscula, descripción en minúscula sin punto final y primera línea de 72 caracteres como máximo.
6. No pushear: el push pasa por la skill `pre-push`.

## Ejemplos

```
feat(front): add sales page with monthly chart
fix(cors): allow preflight requests from vite dev server
refactor(back): move health payload to service layer
docs(readme): document required environment variables
build(deps): bump axios to 1.21
chore(claude): add commit skill
feat(auth)!: replace localStorage token with httpOnly cookie
```

El `!` marca un cambio incompatible y lleva `BREAKING CHANGE: ...` en el footer.
