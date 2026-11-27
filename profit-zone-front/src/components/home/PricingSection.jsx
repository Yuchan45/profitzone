import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { usePacks } from '../../hooks/usePacks.js'
import { useAuth } from '../../hooks/useAuth.js'
import { TIER_LIST, SIGNUP_FREE_CREDITS } from '../../utils/plans.js'
import PackCard from '../molecules/PackCard/PackCard.jsx'

/** Cómo funcionan los créditos: análisis básico gratis vs completo, y los packs. Ancla #precios. */
function PricingSection() {
  const packs = usePacks()
  const { status } = useAuth()
  const logged = status === 'authenticated'
  const buyTo = logged ? '/creditos' : '/registro'

  const bestPackCode = packs.data?.packs.reduce((best, pack) =>
    pack.pricePerCreditUsd < best.pricePerCreditUsd ? pack : best,
  ).code

  return (
    <section id="precios" className="reveal-on-scroll mx-auto max-w-7xl scroll-mt-8 px-5 py-16 sm:px-6 lg:py-24">
      <div className="max-w-2xl">
        <span className="inline-flex rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-brand-text">
          Créditos
        </span>
        <h2 className="mt-4 font-heading text-3xl font-bold text-foreground sm:text-4xl">
          Empezá gratis, pagá solo por lo que usás
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          Al registrarte te regalamos {SIGNUP_FREE_CREDITS} créditos para análisis básicos. El análisis completo usa
          1 crédito pago. Sin suscripción y los créditos no vencen.
        </p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {TIER_LIST.map((tier) => (
          <article
            key={tier.code}
            className={`rounded-2xl border bg-card p-6 shadow-sm ${
              tier.code === 'complete' ? 'border-primary/60 shadow-lg shadow-navy/5' : 'border-border'
            }`}
          >
            <h3 className="font-heading text-xl font-bold text-foreground">Análisis {tier.name.toLowerCase()}</h3>
            <p className="mt-1 text-sm font-semibold text-brand-text">
              1 {tier.creditLabel}
              {tier.code === 'basic' && ` · ${SIGNUP_FREE_CREDITS} al registrarte`}
            </p>
            <ul className="mt-4 grid gap-2.5">
              {tier.features.map((feature) => (
                <li key={feature} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-brand-text" aria-hidden="true" />
                  {feature}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <h3 className="mt-12 font-heading text-xl font-bold text-foreground">Packs de créditos</h3>

      {packs.status === 'loading' && (
        <div className="mt-4 grid gap-4 md:grid-cols-3" aria-busy="true" aria-label="Cargando los packs">
          {[0, 1, 2].map((n) => (
            <div key={n} className="h-56 animate-pulse rounded-2xl bg-secondary" />
          ))}
        </div>
      )}

      {packs.status === 'error' && (
        <p className="mt-4 text-sm text-muted-foreground">
          No pudimos cargar los precios.{' '}
          <button type="button" onClick={packs.retry} className="font-semibold text-brand-text hover:underline">
            Reintentar
          </button>
        </p>
      )}

      {packs.status === 'ok' && (
        <>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {packs.data.packs.map((pack) => (
              <PackCard key={pack.code} pack={pack} featured={pack.code === bestPackCode} buyTo={buyTo} />
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Precios de referencia en dólares, cobrados en pesos al tipo de cambio del día. Pagás con Mercado Pago.{' '}
            <Link to="/terminos" className="font-semibold text-brand-text hover:underline">
              Términos
            </Link>
          </p>
        </>
      )}
    </section>
  )
}

export default PricingSection
