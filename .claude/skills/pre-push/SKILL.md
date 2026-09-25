---
name: pre-push
description: Revisión completa antes de pushear en ProfitZone. Corre lint/build/arranque, /code-review (bugs), review-standards (convenciones) y /security-review, arma un reporte y pushea solo si el usuario lo aprueba. Usar cuando el usuario quiera pushear, subir cambios o pida revisar antes de un push. Un hook bloquea los `git push` de Claude que no pasaron por acá.
---

# Revisión pre-push

El hook `.claude/hooks/require-pre-push.mjs` bloquea cualquier `git push` que ejecute Claude si el `HEAD` no fue aprobado por esta skill.

## 0. Preparar

1. `git status --porcelain`. Si hay cambios sin commitear, avisar que no se van a pushear y preguntar si se commitean antes o se ignoran.
2. Determinar el rango de commits que se van a pushear:
   - `git fetch origin` (si falla por red, seguir con lo que haya local y avisarlo)
   - base = `@{u}` si la rama tiene upstream; si no, `origin/main`
   - `git log --oneline <base>..HEAD`. Si está vacío, no hay nada que pushear: informarlo y terminar.
3. `git diff --stat <base>...HEAD` para saber qué apps se tocaron (`profit-zone-front/`, `profit-zone-back/`, `.claude/`, otros).

## 1. Checks automáticos (rápidos, cortan el flujo si fallan)

Solo para las apps tocadas:

- **Front**: en `profit-zone-front/`, `npm run lint` y `npm run build`.
- **Back**: en `profit-zone-back/`, `npm run smoke -- <endpoints nuevos o modificados del diff>` (ver "Validación" en `profit-zone-back/CLAUDE.md`). Falla si la API no arranca. Revisar que los códigos HTTP sean los esperados.
- **`.claude/`**: si cambió `settings.json`, validar que sea JSON válido (`node -e "JSON.parse(require('fs').readFileSync('.claude/settings.json','utf8'))"`).

Si algo falla, reportarlo y **no seguir** con las revisiones: primero hay que arreglarlo.

## 2. Revisiones (pueden ir en paralelo)

1. **Bugs**: invocar la skill `code-review` con nivel `medium` sobre el rango `<base>...HEAD`.
2. **Estándares**: invocar la skill `review-standards` con el rango `<base>...HEAD`.
3. **Seguridad**: invocar la skill `security-review`. Solo si el diff toca `profit-zone-back/`, auth, manejo de tokens, CORS, variables de entorno o dependencias (`package.json`). Si no, anotar "no aplica". Usar `security-and-hardening` como referencia de criterio.

## 3. Reporte

```
# Pre-push: <N> commits → <remoto>/<rama>

| Check              | Resultado |
|--------------------|-----------|
| Lint / build front | ✅ / ❌ / — |
| Arranque back      | ✅ / ❌ / — |
| Bugs               | N hallazgos (X críticos) |
| Estándares         | N violaciones, M smells |
| Seguridad          | N hallazgos / no aplica |

## Bloqueantes
(bugs críticos, violaciones duras de CLAUDE.md, hallazgos de seguridad altos)

## Sugerencias
(smells, mejoras menores)

Veredicto: LISTO PARA PUSHEAR / CORREGIR ANTES
```

## 4. Decisión y push

- **Hay bloqueantes**: no pushear. Ofrecer corregirlos. Después de corregir y commitear (con la skill `commit`), volver a correr esta skill desde el paso 0.
- **No hay bloqueantes**: preguntar al usuario si pushea. Solo con un "sí" explícito:
  1. Registrar la aprobación del HEAD revisado:
     `git rev-parse HEAD > "$(git rev-parse --git-dir)/claude-pre-push-approved"`
  2. `git push` (con `-u origin <rama>` si la rama no tiene upstream).
- Nunca escribir el archivo de aprobación sin haber completado los pasos 1 a 3 y sin el OK del usuario.
