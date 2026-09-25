# Configuración de Claude Code

Subagentes y skills compartidos del proyecto. Las convenciones de cada app están en `profit-zone-front/CLAUDE.md` y `profit-zone-back/CLAUDE.md`.

## Subagentes (`agents/`)

| Agente      | Para qué                                          |
| ----------- | ------------------------------------------------- |
| `front-dev` | Páginas, componentes, hooks y servicios del front |
| `back-dev`  | Endpoints, services, middlewares y config de la API |

Se invocan pidiéndolo en el prompt ("usá back-dev para...") o con `@`.

## Skills propias

| Skill                 | Uso                                           |
| --------------------- | --------------------------------------------- |
| `front-new-page`      | Página + ruta + link en la Navbar             |
| `front-new-endpoint`  | Servicio Axios + hook para consumir la API    |
| `front-new-component` | Componente + estilos BEM                      |
| `back-new-resource`   | routes + controller + service + README        |
| `back-new-env-var`    | Variable validada en `env.js` + `.env.example` |
| `commit`              | Commits `tipo(scope): descripción` (Conventional Commits) |
| `pre-push`            | Checks + code review + estándares + seguridad, y push con OK |
| `review-standards`    | Diff vs. `CLAUDE.md` + code smells de Fowler  |

También se usan las skills que vienen con Claude Code: `/code-review` (bugs) y `/security-review`.

## Hooks (`settings.json` + `hooks/`)

| Hook                     | Evento            | Qué hace |
| ------------------------ | ----------------- | -------- |
| `require-pre-push.mjs`   | PreToolUse (Bash) | Bloquea los `git push` que ejecute Claude si el `HEAD` no fue aprobado por `/pre-push`. La aprobación se guarda en `.git/claude-pre-push-approved` (local, no se commitea). No afecta los push hechos a mano desde la terminal. |

Para desactivar el hook de Claude temporalmente: `/hooks` en Claude Code, o `"disableAllHooks": true` en `.claude/settings.local.json`.

## Skills externas (copiadas, no se actualizan solas)

| Skill                          | Origen                                                | Commit    |
| ------------------------------ | ----------------------------------------------------- | --------- |
| `impeccable`                   | [pbakaus/impeccable](https://github.com/pbakaus/impeccable) | v4.3.1 (sin `scripts/`, ver abajo) |
| `design-taste-frontend`        | [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) (`skills/taste-skill`) | — |
| `nodejs-backend-patterns`      | [wshobson/agents](https://github.com/wshobson/agents) (`plugins/javascript-typescript/skills/`) | `4236bb9` |
| `api-design-principles`        | [wshobson/agents](https://github.com/wshobson/agents) (`plugins/backend-development/skills/`) | `4236bb9` |
| `auth-implementation-patterns` | [wshobson/agents](https://github.com/wshobson/agents) (`plugins/developer-essentials/skills/`) | `4236bb9` |
| `security-and-hardening`       | [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) (`skills/`) | `bcab6a1` |

`review-standards` es propia, pero su lista de code smells está adaptada de [mattpocock/skills@code-review](https://github.com/mattpocock/skills) (MIT, `c55ee46`).

> ⚠️ **`impeccable` está en modo solo-markdown.** En el original, la skill corre un launcher (`scripts/impeccable`) que descarga desde GitHub un binario sin verificación independiente, lo ejecuta y le pasa su salida a Claude como directivas. Para eliminar ese riesgo se borró la carpeta `scripts/` y se agregó al `SKILL.md` la sección "Markdown-only mode", que prohíbe correr el motor. Se pierden el modo `live`, el detector y su hook, `pin`, `doctor` y la carga automática de contexto. Los principios, los comandos de diseño y las referencias siguen funcionando. Los pasos que el motor automatizaba dentro de `new-work`, `critique`, `polish` y `visualize` (semillas de concepto, briefs, comparación de versiones, historial de críticas) ahora los hace Claude a mano. También se prohíbe `npx impeccable`.
>
> **Al actualizar esta skill desde el upstream:** no copiar `scripts/` y volver a aplicar la sección "Markdown-only mode" en el `SKILL.md`.

`security-and-hardening` se modificó: se copió `references/security-checklist.md` (del root de ese repo) dentro de la skill y se ajustaron sus links.

Para actualizar una skill externa, volver a copiar su carpeta desde el repo de origen y actualizar el commit en esta tabla.
