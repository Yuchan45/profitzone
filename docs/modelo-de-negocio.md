# Modelo de negocio: créditos

ProfitZone se usa con **créditos**: sin suscripción, sin vencimiento. Este documento resume las reglas
implementadas. La fuente de verdad en el código es `profit-zone-back/src/config/plans.js` (el front
la espeja en `profit-zone-front/src/utils/plans.js`).

## Créditos

| Tipo  | Cómo se consigue                                        | Para qué sirve        |
| ----- | ------------------------------------------------------- | --------------------- |
| Gratis | 3 al registrarse (`FREE_CREDITS_ON_SIGNUP`), una sola vez | Análisis **básico**   |
| Pago  | Comprando un pack                                       | Análisis **completo** |

Los créditos no vencen. Los administradores (`role = admin`) no gastan créditos.

## Niveles de análisis

| Característica                         | Básico (1 crédito gratis) | Completo (1 crédito pago) |
| -------------------------------------- | ------------------------- | ------------------------- |
| Radio máximo                           | 600 m                     | 2 km                      |
| Competencia (OpenStreetMap)            | Sí                        | Sí                        |
| Ratings y reseñas de Google            | No                        | Sí                        |
| Densidad, demografía, afluencia        | Sí                        | Sí                        |
| Alquileres: estadísticas               | Sí                        | Sí                        |
| Alquileres: listado de avisos          | No                        | Sí                        |
| Reporte en pantalla                    | Sí                        | Sí                        |
| Reporte en PDF                         | No                        | Sí                        |
| Historial                              | Solo el último reporte    | Completo                  |

## Reglas de cobro

- Se cobra al tocar **"Analizar zona"** (`PATCH /api/analyses/:id/location` con `tier`).
- Volver a analizar el **mismo punto y radio** no cobra de nuevo; **cambiar el punto o el radio** sí.
- **Mejorar** un análisis básico a completo (`POST /api/analyses/:id/upgrade`) cuesta 1 crédito pago.
- **Reabrir** un reporte ya generado es gratis.
- Si el reporte **falla la primera vez**, se devuelve el crédito (`REPORT_FAILED`, 502).
- Los reportes básicos viejos quedan **bloqueados** (`REPORT_LOCKED`, 403): solo el último básico se
  puede reabrir. Mejorarlos a completo los desbloquea.
- Sin créditos suficientes: 402 `INSUFFICIENT_CREDITS`. Radio mayor a 600 m en básico: 403
  `RADIUS_REQUIRES_COMPLETE`.
- Todo movimiento queda en `billing.credit_transactions` (libro de créditos) y los saldos se
  actualizan con operaciones atómicas (`UPDATE … OUTPUT`), nunca leyendo y escribiendo aparte.

## Packs

| Pack     | Créditos | Precio  | Por crédito |
| -------- | -------- | ------- | ----------- |
| `pack-1` | 1        | USD 3   | USD 3,00    |
| `pack-5` | 5        | USD 12  | USD 2,40    |
| `pack-15`| 15       | USD 30  | USD 2,00    |

Se cobran en **pesos** al dólar del día (dolarapi.com, cacheado 1 h; si falla, `USD_ARS_FALLBACK`).

## Pasarela de pago

`PAYMENT_PROVIDER` define cómo se paga:

- **`mock` (por defecto):** checkout de demostración en `/creditos/simulado/:id`. Acredita sin cobrar.
  Sirve para demos y desarrollo. **En producción con `mock`, cualquier usuario puede darse créditos.**
- **`mercadopago`:** crea una preferencia de Checkout Pro (requiere `MP_ACCESS_TOKEN`), vuelve a
  `/creditos/resultado` y acredita al aprobarse. El webhook `POST /api/billing/webhook/mercadopago`
  **vuelve a consultar el pago a la API de Mercado Pago** (no confía en el cuerpo recibido) y es
  idempotente: una compra solo acredita una vez, aunque lleguen varios avisos o el usuario
  sincronice a mano (`POST /api/billing/orders/:id/sync`).

## Endpoints

| Método | Ruta                                     | Acceso  | Descripción                          |
| ------ | ---------------------------------------- | ------- | ------------------------------------ |
| GET    | `/api/billing/packs`                     | Público | Packs con precio en USD y ARS        |
| GET    | `/api/billing/credits`                   | Sesión  | Saldo y últimos movimientos          |
| GET    | `/api/billing/orders`                    | Sesión  | Compras del usuario                  |
| POST   | `/api/billing/checkout`                  | Sesión  | Crea la compra (`{ packCode }`)      |
| GET    | `/api/billing/orders/:id`                | Sesión  | Estado de una compra                 |
| POST   | `/api/billing/orders/:id/sync`           | Sesión  | Re-verifica el pago y acredita       |
| POST   | `/api/billing/orders/:id/simulate-pay`   | Sesión  | Confirma el checkout simulado (mock) |
| POST   | `/api/billing/webhook/mercadopago`       | Público | Aviso de Mercado Pago                |
| POST   | `/api/analyses/:id/upgrade`              | Sesión  | Mejora básico → completo             |

## Pendiente (fuera de esta versión)

- Verificar el correo antes de regalar los créditos gratis (evita cuentas descartables).
- Credenciales reales de Mercado Pago y su webhook público.
- Rate limit compartido (hoy es en memoria: en Vercel cada instancia cuenta por separado).
