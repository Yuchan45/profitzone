import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import {
  getCurrentUser,
  postForgotPassword,
  postLogin,
  postLogout,
  postRefresh,
  postRegister,
  postResetPassword,
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

// Cada pedido manda un correo: límite más bajo para no usarlo como spam
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { status: 'error', message: 'Demasiados pedidos. Probá de nuevo en unos minutos.' },
})

router.post('/register', credentialsLimiter, postRegister)
router.post('/login', credentialsLimiter, postLogin)
router.post('/forgot-password', forgotPasswordLimiter, postForgotPassword)
router.post('/reset-password', credentialsLimiter, postResetPassword)
// Usan la cookie httpOnly: solo desde orígenes permitidos (defensa CSRF)
router.post('/refresh', requireTrustedOrigin, postRefresh)
router.post('/logout', requireTrustedOrigin, postLogout)
router.get('/me', requireAuth, getCurrentUser)

export default router
