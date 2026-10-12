import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import {
  getCurrentUser,
  postLogin,
  postLogout,
  postRefresh,
  postRegister,
} from '../controllers/auth.controller.js'
import { requireAuth } from '../middlewares/requireAuth.js'
import { requireTrustedOrigin } from '../middlewares/requireTrustedOrigin.js'

const router = Router()

// Límite de intentos por IP para frenar fuerza bruta en login y registro
const credentialsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { status: 'error', message: 'Demasiados intentos. Probá de nuevo en unos minutos.' },
})

router.post('/register', credentialsLimiter, postRegister)
router.post('/login', credentialsLimiter, postLogin)
// Usan la cookie httpOnly: solo desde orígenes permitidos (defensa CSRF)
router.post('/refresh', requireTrustedOrigin, postRefresh)
router.post('/logout', requireTrustedOrigin, postLogout)
router.get('/me', requireAuth, getCurrentUser)

export default router
