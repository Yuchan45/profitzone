import app from './app.js'
import { env } from './config/env.js'

const server = app.listen(env.port)
let shuttingDown = false

server.on('listening', () => {
  console.log(`[ProfitZone] API escuchando en http://localhost:${env.port}/api`)
  console.log(`[ProfitZone] Entorno: ${env.nodeEnv}`)
  console.log(`[ProfitZone] Orígenes CORS permitidos: ${env.corsOrigins.join(', ')}`)
})

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(
      `[ProfitZone] El puerto ${env.port} ya está en uso. Cerrá el proceso que lo ocupa o cambiá PORT en tu .env.`,
    )
    process.exit(1)
  }
  console.error('[ProfitZone] Error al iniciar el servidor:', error)
  process.exit(1)
})

// En Windows, si otro proceso ya tiene el puerto, el listen puede "arrancar" y
// cerrarse enseguida sin EADDRINUSE: sin este aviso el proceso se iría en silencio.
server.on('close', () => {
  if (!shuttingDown) {
    console.error(
      `[ProfitZone] El servidor se cerró inesperadamente. Verificá que nada más esté usando el puerto ${env.port}.`,
    )
    process.exitCode = 1
  }
})

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    shuttingDown = true
    console.log(`\n[ProfitZone] ${signal} recibido, cerrando servidor...`)
    server.close(() => process.exit(0))
  })
}
