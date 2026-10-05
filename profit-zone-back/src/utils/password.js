import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scryptAsync = promisify(scrypt)

// Parámetros de scrypt (costo). N = 2^15 usa ~32 MB por hash: por eso maxmem.
const N = 2 ** 15
const R = 8
const P = 1
const KEY_LENGTH = 64
const SALT_BYTES = 16
const MAX_MEM = 64 * 1024 * 1024

/**
 * Hashea una contraseña con scrypt (node:crypto, sin dependencias).
 * Formato guardado: scrypt$N$r$p$salt$hash (salt y hash en base64url).
 * Incluye los parámetros para poder subir el costo a futuro sin romper los hashes viejos.
 */
export async function hashPassword(password) {
  const salt = randomBytes(SALT_BYTES)
  const hash = await scryptAsync(password, salt, KEY_LENGTH, { N, r: R, p: P, maxmem: MAX_MEM })
  return ['scrypt', N, R, P, salt.toString('base64url'), hash.toString('base64url')].join('$')
}

/** Compara una contraseña con un hash guardado, en tiempo constante. */
export async function verifyPassword(password, stored) {
  const parts = typeof stored === 'string' ? stored.split('$') : []
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false

  const [, n, r, p, saltB64, hashB64] = parts
  const expected = Buffer.from(hashB64, 'base64url')
  const actual = await scryptAsync(password, Buffer.from(saltB64, 'base64url'), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: MAX_MEM,
  })
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

// Hash de una contraseña aleatoria: el login lo verifica cuando el email no
// existe, para tardar lo mismo y no revelar qué correos están registrados.
let dummyHashPromise
export function getDummyPasswordHash() {
  dummyHashPromise ??= hashPassword(randomBytes(32).toString('base64url'))
  return dummyHashPromise
}
