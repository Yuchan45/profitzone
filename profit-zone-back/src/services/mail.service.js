import nodemailer from 'nodemailer'
import { env } from '../config/env.js'

// undefined: todavía no se creó; null: no hay SMTP configurado
let transporter

function getTransporter() {
  if (transporter !== undefined) return transporter
  transporter = env.mail.host
    ? nodemailer.createTransport({
        host: env.mail.host,
        port: env.mail.port,
        // 465 es SMTPS; el resto (587, 25) arranca en claro y pasa a TLS con STARTTLS
        secure: env.mail.port === 465,
        auth: env.mail.user ? { user: env.mail.user, pass: env.mail.password } : undefined,
      })
    : null
  return transporter
}

/**
 * Manda un correo. Sin SMTP configurado no falla: en desarrollo muestra el
 * texto en la consola (para poder seguir el link) y en producción avisa.
 */
export async function sendMail({ to, subject, text, html }) {
  const mailer = getTransporter()
  if (!mailer) {
    if (env.isProduction) {
      console.warn(`[ProfitZone] SMTP_HOST no está configurado: no se mandó el correo "${subject}".`)
    } else {
      console.info(`[ProfitZone] Correo sin enviar (falta SMTP_HOST). Para: ${to} | ${subject}\n${text}`)
    }
    return
  }
  await mailer.sendMail({ from: env.mail.from, to, subject, text, html })
}
