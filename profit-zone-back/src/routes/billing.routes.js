import { Router } from 'express'
import { requireAuth } from '../middlewares/requireAuth.js'
import {
  getMyCredits,
  getMyOrders,
  getOrder,
  getPacks,
  postCheckout,
  postMercadoPagoWebhook,
  postSimulatePayment,
  postSyncOrder,
} from '../controllers/billing.controller.js'

const router = Router()

// Los packs y sus precios son públicos (también los muestra la home)
router.get('/packs', getPacks)

// Lo llama Mercado Pago: no tiene sesión
router.post('/webhook/mercadopago', postMercadoPagoWebhook)

router.get('/credits', requireAuth, getMyCredits)
router.get('/orders', requireAuth, getMyOrders)
router.post('/checkout', requireAuth, postCheckout)
router.get('/orders/:id', requireAuth, getOrder)
router.post('/orders/:id/sync', requireAuth, postSyncOrder)
router.post('/orders/:id/simulate-pay', requireAuth, postSimulatePayment)

export default router
