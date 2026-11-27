import api from './api.js'

/**
 * Le manda la conversación a Zoni (POST /api/assistant/chat) y devuelve su respuesta.
 * `messages`: [{ role: 'user' | 'assistant', content }]; `context`: texto de lo que se está viendo.
 */
export async function askZoni(messages, context) {
  const { data } = await api.post('/assistant/chat', { messages, context })
  return data.reply
}
