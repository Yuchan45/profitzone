// Smoke test de la API: la levanta en un puerto aparte, espera a que responda
// /api/health, prueba las rutas pedidas y la apaga (también en Windows).
//
// Uso:
//   npm run smoke                                   → solo /api/health
//   npm run smoke -- /api/ventas /api/ventas/99     → GET a cada ruta
//   npm run smoke -- POST /api/ventas '{"monto":10}' → método y body JSON
import { spawn } from 'node:child_process'

const PORT = process.env.SMOKE_PORT || '8081'
const BASE_URL = `http://localhost:${PORT}`
const STARTUP_TIMEOUT_MS = 10_000
const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

// Git Bash en Windows convierte "/api/x" en "C:/Program Files/Git/api/x": se recorta
// desde "/api". También acepta rutas sin barra inicial ("api/x").
function normalizePath(path) {
  const index = path.indexOf('/api')
  return index >= 0 ? path.slice(index) : `/${path.replace(/^\/+/, '')}`
}

function parseRequests(args) {
  const requests = []
  for (let i = 0; i < args.length; i++) {
    const method = METHODS.includes(args[i]) ? args[i++] : 'GET'
    const path = normalizePath(args[i])
    const body = args[i + 1]?.startsWith('{') ? args[++i] : undefined
    requests.push({ method, path, body })
  }
  return requests
}

async function waitForHealth(server) {
  const deadline = Date.now() + STARTUP_TIMEOUT_MS
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`la API terminó al arrancar (código ${server.exitCode})`)
    }
    try {
      const res = await fetch(`${BASE_URL}/api/health`)
      if (res.ok) return
    } catch {
      // Todavía no escucha: reintentar.
    }
    await new Promise((resolve) => setTimeout(resolve, 300))
  }
  throw new Error(`la API no respondió /api/health en ${STARTUP_TIMEOUT_MS / 1000} s`)
}

async function run({ method, path, body }) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body,
  })
  const text = await res.text()
  console.log(`${method} ${path} → ${res.status}`)
  console.log(`  ${text.length > 500 ? `${text.slice(0, 500)}…` : text}`)
}

const server = spawn(process.execPath, ['src/server.js'], {
  env: {
    ...process.env,
    PORT,
    CORS_ORIGINS: process.env.CORS_ORIGINS || 'http://localhost:5173',
  },
  stdio: ['ignore', 'ignore', 'pipe'],
})

let serverErrors = ''
server.stderr.on('data', (chunk) => {
  serverErrors += chunk
})

try {
  await waitForHealth(server)
  const requests = parseRequests(process.argv.slice(2))
  for (const request of requests.length > 0 ? requests : [{ method: 'GET', path: '/api/health' }]) {
    await run(request)
  }
} catch (error) {
  console.error(`[ProfitZone] Smoke test falló: ${error.message}`)
  if (serverErrors) console.error(serverErrors)
  process.exitCode = 1
} finally {
  server.kill()
}
