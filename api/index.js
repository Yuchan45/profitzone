// Punto de entrada de la API en Vercel: la misma app de Express que en local levanta
// profit-zone-back/src/server.js, pero sin listen (Vercel la invoca en cada request).
// vercel.json manda acá todo /api/*. Ver docs/deploy.md.
import '../profit-zone-back/src/models/index.js'
import app from '../profit-zone-back/src/app.js'

export default app
