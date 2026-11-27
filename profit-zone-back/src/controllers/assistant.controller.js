import { askAssistant } from '../services/assistant.service.js'

/** POST /api/assistant/chat { messages: [{ role, content }], context?: string } -> { reply, mode } */
export async function postAssistantChat(req, res) {
  const { messages, context } = req.body ?? {}
  res.json(await askAssistant({ messages, context }))
}
