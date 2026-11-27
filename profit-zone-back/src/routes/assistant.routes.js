import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import { postAssistantChat } from '../controllers/assistant.controller.js'

const router = Router()

// Cada consulta cuesta plata (Azure OpenAI): tope por IP para que no se use de más
const chatLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { status: 'error', message: 'Estás preguntando muy seguido. Probá de nuevo en unos minutos.' },
})

router.post('/chat', chatLimiter, postAssistantChat)

export default router
