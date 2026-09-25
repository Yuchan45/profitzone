// Smoke test de la API: la levanta en un puerto aparte, espera a que responda
// /api/health, prueba las rutas pedidas y la apaga (también en Windows).
//
// Uso:
//   npm run smoke                                    → solo /api/health
//   npm run smoke -- /api/ventas /api/ventas/99      → GET a cada ruta
//   npm run smoke -- POST /api/ventas '{"monto":10}'  → método y body JSON (bash)
//   npm run smoke -- POST /api/ventas @body.json      → body desde archivo (cualquier shell)
//
// Herramienta de desarrollo: lee process.env directamente (SMOKE_PORT y la
// configuración que hereda la API), fuera de la regla de src/config/env.js.
import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import net from 'node:net'

const PORT = Number(process.env.SMOKE_PORT || 8081)
const BASE_URL = `http://localhost:${PORT}`
const STARTUP_TIMEOUT_MS = 10_000
const REQUEST_TIMEOUT_MS = 5_000
const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
const PREFIX = '[ProfitZone]'

// Git Bash en Windows convierte "/api/x" en "C:/Program Files/Git/api/x": se recorta
// desde "/api". También acepta rutas sin barra inicial ("api/x").
function normalizePath(path) {
  const index = path.indexOf('/api')
  return index >= 0 ? path.slice(index) : `/${path.replace(/^\/+/, '')}`
}

function readBody(arg) {
  const body = arg.startsWith('@') ? readFileSync(arg.slice(1), 'utf8') : arg
  try {
    JSON.parse(body)
  } catch {
    throw new Error(
      `el body no es JSON válido: ${body}. En PowerShell escapá las comillas ('{\\"a\\":1}') o usá @archivo.json`,
    )
  }
  return body
}

function isBodyArg(arg) {
  return arg !== undefined && /^[@{[]/.test(arg)
}

function parseRequests(args) {
  const requests = []
  for (let i = 0; i < args.length; i++) {
    const method = METHODS.includes(args[i]) ? args[i++] : 'GET'
    if (args[i] === undefined) {
      throw new Error(`falta la ruta después de ${method}`)
    }
    const path = normalizePath(args[i])
    const body = isBodyArg(args[i + 1]) ? readBody(args[++i]) : undefined
    requests.push({ method, path, body })
  }
  return requests.length > 0 ? requests : [{ method: 'GET', path: '/api/health' }]
}

function assertPortFree() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer()
    probe.once('error', () =>
      reject(new Error(`el puerto ${PORT} ya está en uso: cerrá ese proceso o usá SMOKE_PORT=<otro>`)),
    )
    probe.once('listening', () => probe.close(resolve))
    probe.listen(PORT)
  })
}

async function waitForHealth(server) {
  const deadline = Date.now() + STARTUP_TIMEOUT_MS
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`la API terminó al arrancar (código ${server.exitCode})`)
    }
    try {
      const res = await fetch(`${BASE_URL}/api/health`, { signal: AbortSignal.timeout(1_000) })
      if (res.ok) return
    } catch {
      // Todavía no escucha: reintentar.
    }
    await new Promise((resolve) => setTimeout(resolve, 300))
  }
  throw new Error(`la API no respondió /api/health en ${STARTUP_TIMEOUT_MS / 1000} s`)
}

async function run({ method, path, body }) {
  let res
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch (error) {
    throw new Error(`${method} ${path} no respondió en ${REQUEST_TIMEOUT_MS / 1000} s (${error.name})`)
  }
  const text = await res.text()
  console.log(`${PREFIX} ${method} ${path} → ${res.status}`)
  console.log(`  ${text.length > 500 ? `${text.slice(0, 500)}…` : text}`)
}

let server
let serverErrors = ''

try {
  // Se valida todo antes de levantar la API: argumentos y puerto libre (si otro
  // proceso ya escucha ahí, el smoke probaría ese proceso en vez del código actual).
  const requests = parseRequests(process.argv.slice(2))
  await assertPortFree()

  server = spawn(process.execPath, ['src/server.js'], {
    env: {
      ...process.env,
      PORT: String(PORT),
      // `??` y no `||`: una variable vaciada a propósito (test de obligatoria) se respeta.
      CORS_ORIGINS: process.env.CORS_ORIGINS ?? 'http://localhost:5173',
    },
    stdio: ['ignore', 'ignore', 'pipe'],
  })
  server.stderr.on('data', (chunk) => {
    serverErrors += chunk
  })

  await waitForHealth(server)
  for (const request of requests) {
    await run(request)
  }
} catch (error) {
  console.error(`${PREFIX} Smoke test falló: ${error.message}`)
  if (serverErrors) console.error(serverErrors)
  process.exitCode = 1
} finally {
  server?.kill()
}
