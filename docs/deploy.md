# Deploy a producción: Vercel + Azure SQL

```
Navegador ──HTTPS──▶ Vercel (un solo proyecto, un solo dominio)
                      ├─ /          la web (build de profit-zone-front, archivos estáticos)
                      └─ /api/*     la API (api/index.js → app de Express de profit-zone-back)
                                       │
                                       └──TLS──▶ Azure SQL Database (oferta gratis)
```

**Por qué así:**
- La web y la API comparten dominio. La cookie de sesión (`SameSite=Strict`) y el CORS funcionan
  igual que en local, y el límite de intentos ve la IP real de cada usuario.
- Azure SQL es el mismo motor que el SQL Server de desarrollo, con datos geográficos: las
  migraciones y las consultas por radio corren sin cambios.

## Costos y límites (todo gratis)

| Servicio | Plan | Límite que importa |
|---|---|---|
| Vercel | Hobby | Uso no comercial (sirve para el proyecto de la facultad). |
| Azure SQL Database | Oferta gratis (serverless) | 32 GB y 100.000 segundos de vCore por mes. **Se pausa sola** después de 1 h sin uso: la primera request después de una pausa tarda hasta un minuto (la API reintenta sola). Si se agota el límite del mes, la base se pausa hasta el mes siguiente, sin cobrar. |
| Google Places | Pago por uso | Solo se consulta al analizar una zona, con sesión. **Sin `GOOGLE_PLACES_API_KEY`, la competencia del análisis sale con locales simulados.** |

**Antes de una demo:** abrir `https://<dominio>/api/health` un par de minutos antes para que la
base se despierte.

## 1. Crear la base en Azure

Con una cuenta de Azure (Azure for Students con el mail de la UADE: sin tarjeta).

1. En el portal, **Azure SQL** → **Crear** → **SQL Database**. Aceptar el cartel **"Aplicar oferta"**
   (base gratis).
2. **Grupo de recursos:** uno nuevo, `profitzone`.
3. **Nombre de la base: `ProfitZone`**, exacto: es el `DB_NAME`. Si no coincide, las migraciones
   fallan a propósito en vez de crear otra base, que sería paga.
4. **Servidor:** uno nuevo, por ejemplo `profitzone-sql` (queda `profitzone-sql.database.windows.net`).
   - Región: **South Africa North**. Azure for Students solo permite 5 regiones (`brazilsouth`,
     `northcentralus`, `southafricanorth`, `newzealandnorth`, `canadacentral`) y, para SQL, la
     suscripción de estudiante no tiene acceso a Brazil South, Canada Central ni North Central US
     ("Your subscription does not have access to create a server in the selected region"). Si tu
     suscripción sí lo tiene, usá Brazil South y poné `gru1` en `vercel.json`.
   - Autenticación: **SQL**. Usuario administrador (no puede ser `sa`) y una contraseña fuerte:
     8+ caracteres, mayúsculas, minúsculas, números y símbolos, sin `$`.
5. **Comportamiento al llegar al límite gratis:** pausar la base hasta el mes siguiente.
6. **Redes:** acceso público (Public endpoint). El formulario de creación no deja cargar un rango:
   una vez creado, en el servidor → **Networking** → **Add a firewall rule**, con nombre
   `allow-all`, de `0.0.0.0` a `255.255.255.255`, y **Save**.
   Vercel no tiene IPs fijas en el plan gratis: la protección es la contraseña y la conexión
   cifrada. Si se pasa a un plan con IPs fijas, hay que achicar esta regla.

## 2. Cargar el esquema y los datos

Desde una PC con el repo, Node 20+ y las dependencias del back (`npm install` en
`profit-zone-back`).

1. Crear `profit-zone-back/.env.produccion`. No se versiona: `.gitignore` ignora todo `.env.*`
   menos `.env.example`. Contenido:

   ```bash
   NODE_ENV=production
   CORS_ORIGINS=https://<dominio>.vercel.app
   DB_HOST=<servidor>.database.windows.net
   DB_NAME=ProfitZone
   DB_USER=<usuario administrador>
   DB_PASSWORD=<contraseña>
   DB_ENCRYPT=true
   JWT_ACCESS_SECRET=<cualquier valor de 32+ caracteres: los seeds no lo usan>
   ```

2. Poner `zonaprop_locales_caba_alquiler.json` en `profit-zone-back/src/db/seeders/data/`
   (no está en el repo: pedíselo al equipo).

3. Migrar y cargar todo. Desde `profit-zone-back/`, en Git Bash:

   ```bash
   DOTENV_CONFIG_PATH=.env.produccion npm run db:seed:all
   ```

   Corre las migraciones, el catálogo, el censo, los avisos de alquiler y los negocios y el
   transporte de OpenStreetMap (los baja de Overpass). Es idempotente: se puede repetir.

## 3. Publicar en Vercel

Desde la raíz del repo, con la rama que se quiere publicar:

```bash
npx vercel login                 # una vez: abre el navegador para iniciar sesión
npx vercel link                  # una vez: crea o elige el proyecto "profitzone"
npx vercel --prod                # publica
```

En el proyecto, **Settings → Environment Variables**, entorno **Production**:

| Variable | Valor |
|---|---|
| `NODE_ENV` | `production` |
| `CORS_ORIGINS` | `https://<dominio>.vercel.app` |
| `FRONTEND_URL` | `https://<dominio>.vercel.app` |
| `DB_HOST` | `<servidor>.database.windows.net` |
| `DB_NAME` | `ProfitZone` |
| `DB_USER` | el usuario administrador de Azure |
| `DB_PASSWORD` | su contraseña |
| `DB_ENCRYPT` | `true` |
| `JWT_ACCESS_SECRET` | uno **nuevo** de 48 bytes, distinto del de desarrollo: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `GOOGLE_PLACES_API_KEY` | la clave de Google Places (New) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | el correo para recuperar contraseñas (por ejemplo Gmail: `smtp.gmail.com`, `587`, la cuenta y una contraseña de aplicación) |

Ingreso con Google (opcional): `GOOGLE_CLIENT_ID`. Se crea en Google Cloud Console → APIs y servicios → Credenciales → **ID de cliente de OAuth** (tipo *Aplicación web*), con el dominio de la app (por ejemplo `https://profitzone-ten.vercel.app`) en **Orígenes autorizados de JavaScript**; no hace falta URI de redireccionamiento ni el secreto. Sin la variable, el botón "Continuar con Google" queda deshabilitado. La API valida el token con Google, exige correo verificado y, si ya hay una cuenta con ese correo, la vincula. Al vincularla por primera vez cambia la contraseña por una aleatoria y cierra las sesiones abiertas: el registro no verifica el correo, así que podía haberla creado otra persona. Quien tenía contraseña la recupera con "¿Olvidaste tu contraseña?".

Asistente Zoni (opcional): `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_DEPLOYMENT_NAME` y `AZURE_OPENAI_API_VERSION` (por defecto `2024-10-21`). Sin ellas el chat responde con un modo local de referencia. `POST /api/assistant/chat` está limitado a 30 consultas cada 10 minutos por IP.

Créditos y pagos (opcionales; los valores por defecto sirven para una demo, ver `docs/modelo-de-negocio.md`):

| Variable | Valor |
| --- | --- |
| `PAYMENT_PROVIDER` | `mock` (por defecto: checkout de demostración que acredita sin cobrar) o `mercadopago` |
| `MP_ACCESS_TOKEN` | access token de Mercado Pago (solo con `mercadopago`); el webhook es `https://<tu-dominio>/api/billing/webhook/mercadopago` |
| `FREE_CREDITS_ON_SIGNUP` | créditos gratis al registrarse (3 por defecto) |
| `FX_API_URL`, `USD_ARS_FALLBACK` | cotización del dólar y valor de respaldo si la consulta falla (1200 por defecto) |

> Con `PAYMENT_PROVIDER=mock` en producción **cualquier usuario puede darse créditos pagos** desde la
> pantalla de compra. Está bien para una demo; para cobrar de verdad hay que pasar a `mercadopago`.

Las migraciones (incluida la de créditos, `0016`) se aplican con `npm run db:migrate` en `profit-zone-back`
apuntando a la base de producción, **antes** de publicar el código que las usa.

Las variables se leen al publicar: después de cambiar una, volver a correr `npx vercel --prod`.

Lo que hace `vercel.json`:
- **Instala** las dos apps (`npm ci` en cada carpeta) y **compila la web** con `VITE_API_URL=/api`.
- Manda `/api/*` a la función `api/index.js` y el resto a `index.html`, para las rutas de React Router.
- Corre la API en **Ciudad del Cabo** (`cpt1`), cerca de la base en South Africa North: cada consulta
  paga la latencia hacia la base, así que conviene que la API esté pegada a ella. Si Vercel rechaza
  `cpt1` en el plan Hobby, sacá `regions` o usá `fra1`.

`.vercelignore` evita subir los `.env` y los avisos de Zonaprop.

## 4. Verificar

1. `https://<dominio>/api/health` → `{"status":"ok", ...}` con la base conectada.
2. Crear una cuenta, analizar una zona y abrir **Mis reportes**.
3. **Recuperar contraseña:** tiene que llegar el mail, con el link al dominio de producción.
4. Si algo falla: **Vercel → proyecto → Logs**. Los mensajes de la API empiezan con `[ProfitZone]`.

## Actualizar

- **Código nuevo:** desde la rama que se publica, `npx vercel --prod`.
- **Migración nueva:** `DOTENV_CONFIG_PATH=.env.produccion npm run db:migrate`, antes de publicar el
  código que la usa.
- **Deploy automático (opcional):** si el dueño del repo conecta el proyecto de Vercel a GitHub
  (Settings → Git), cada merge a la rama elegida se publica solo.

## Problemas frecuentes

| Síntoma | Causa y solución |
|---|---|
| La primera carga tarda o `/api/health` da 503 | La base estaba pausada. Esperar un minuto y reintentar. |
| `Origen no permitido por CORS` en los logs | `CORS_ORIGINS` no tiene el dominio exacto (con `https://` y sin `/` final). |
| Se pierde la sesión al recargar | `NODE_ENV` no es `production` o falta HTTPS: la cookie es `Secure` en producción. |
| `Login failed for user` | Usuario o contraseña de Azure mal cargados en Vercel. |
| `Cannot open server ... requested by the login` | El firewall de Azure no tiene la regla del paso 1.6. |
