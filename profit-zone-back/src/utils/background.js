import { waitUntil } from '@vercel/functions'

/**
 * Deja terminar un trabajo que sigue después de responder (por ejemplo, mandar un correo).
 * En Vercel la función se congela al mandar la respuesta: waitUntil la mantiene viva hasta
 * que la promesa termine. Corriendo con node (npm run dev) no hace nada: el proceso sigue igual.
 */
export function runInBackground(promise) {
  waitUntil(promise)
}
