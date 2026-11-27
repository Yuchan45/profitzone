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

function createLimiter(limit, message) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { status: 'error', message },
  })
}

const registerLimiter = createLimiter(10, 'Demasiados intentos. Probá de nuevo en unos minutos.')
const loginLimiter = createLimiter(10, 'Demasiados intentos. Probá de nuevo en unos minutos.')
const resetPasswordLimiter = createLimiter(10, 'Demasiados intentos. Probá de nuevo en unos minutos.')
// Cada pedido manda un correo: límite más bajo para no usarlo como spam
const forgotPasswordLimiter = createLimiter(5, 'Demasiados pedidos. Probá de nuevo en unos minutos.')
const refreshLimiter = createLimiter(60, 'Demasiados pedidos de renovación de sesión.')

router.post('/register', registerLimiter, postRegister)
router.post('/login', loginLimiter, postLogin)
router.post('/forgot-password', forgotPasswordLimiter, postForgotPassword)
router.post('/reset-password', resetPasswordLimiter, postResetPassword)
// Usan la cookie httpOnly: solo desde orígenes permitidos (defensa CSRF)
router.post('/refresh', requireTrustedOrigin, refreshLimiter, postRefresh)
router.post('/logout', requireTrustedOrigin, postLogout)
router.get('/me', requireAuth, getCurrentUser)

export default router
