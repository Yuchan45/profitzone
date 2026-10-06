import { cn } from '../../lib/utils.js'

function Pin({ x, y, className }) {
  return (
    <g transform={`translate(${x} ${y - 16})`}>
      <path d="M0 16 C-11 3 -15 -2 -15 -10 A15 15 0 0 1 15 -10 C15 -2 11 3 0 16Z" className={className} />
      <circle cy="-10" r="5.5" className="fill-card" />
    </g>
  )
}

function Chip({ children, selected }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        selected ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
      }`}
    >
      {children}
    </span>
  )
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg bg-secondary px-2.5 py-1.5">
      <p className="text-[10px] font-semibold text-muted-foreground">{label}</p>
      <p className="mt-0.5 border-l-2 border-primary pl-1.5 font-heading text-sm font-bold text-foreground">
        {value}
      </p>
    </div>
  )
}

const QUESTIONS = [
  {
    title: '¿Qué querés abrir?',
    options: ['Café', 'Gimnasio', 'Librería', 'Ropa'],
    selected: [0],
  },
  {
    title: '¿Cómo vas a atender?',
    options: ['A la calle', 'En galería', 'Sin público'],
    selected: [0],
  },
  {
    title: '¿A quién le vendés?',
    hint: 'Podés elegir más de uno.',
    options: ['Familias', 'Jóvenes', 'Adultos', '60+'],
    selected: [1, 2],
  },
  {
    title: '¿Cuánto podés pagar de alquiler?',
    hint: 'Por mes, ajustado por inflación.',
    options: ['Hasta $500k', '$500k–$1M', '$1M–$2M', 'Más de $2M'],
    selected: [1],
  },
]

function BusinessPanel() {
  return (
    <div className="text-[2cqw] leading-none">
      {QUESTIONS.map(({ title, hint, options, selected }, qi) => (
        <div key={title} className={cn(qi > 0 && 'mt-[1.3em] border-t border-border pt-[1.3em]')}>
          <p className="font-heading text-[1.2em] font-bold leading-tight text-foreground">{title}</p>
          {hint && (
            <p className="mt-[0.25em] text-[0.9em] leading-tight text-muted-foreground">{hint}</p>
          )}
          <div className="mt-[0.8em] flex flex-wrap gap-[0.6em]">
            {options.map((option, oi) => (
              <span
                key={option}
                className={cn(
                  'whitespace-nowrap rounded-full border px-[1em] py-[0.6em] font-medium',
                  selected.includes(oi)
                    ? 'border-primary bg-primary/10 text-brand-text'
                    : 'border-border bg-card text-foreground',
                )}
              >
                {option}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function RadiusPanel() {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-[11px] font-semibold text-muted-foreground">Ubicación</p>
        <p className="mt-1 rounded-lg bg-secondary px-2.5 py-1.5 font-heading text-sm font-bold text-foreground">
          Palermo, CABA
        </p>
      </div>
      <div>
        <p className="text-[11px] font-semibold text-muted-foreground">Radio de análisis</p>
        <div className="mt-1.5 flex gap-1.5">
          <Chip>200 m</Chip>
          <Chip selected>400 m</Chip>
          <Chip>600 m</Chip>
        </div>
      </div>
    </div>
  )
}

function ReportPanel() {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[1fr_1.1fr] gap-2">
        <div className="space-y-2">
          <Stat label="Competencia" value="Media" />
          <Stat label="Alquiler" value="Medio" />
        </div>
        <div className="rounded-lg bg-secondary p-2">
          <p className="text-[10px] font-semibold text-muted-foreground">Afluencia</p>
          <svg viewBox="0 0 160 90" className="mx-auto mt-1 block h-auto w-[88%]">
            <path d="M0 45 H160 M0 80 H160" fill="none" strokeWidth="1" className="stroke-border" />
            <path
              d="M0 60 L30 52 L60 58 L95 30 L125 22 L160 12"
              fill="none" strokeWidth="2" strokeLinejoin="round" className="stroke-primary"
            />
            <path
              d="M0 72 L30 68 L60 74 L95 58 L125 46 L160 52"
              fill="none" strokeWidth="2" strokeDasharray="5 4" className="stroke-amber-400"
            />
          </svg>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-primary/10 px-2.5 py-1.5">
          <p className="text-[10px] font-semibold text-muted-foreground">Fortalezas</p>
          <p className="font-heading text-xl font-bold text-brand-text">5</p>
        </div>
        <div className="rounded-lg bg-amber-400/15 px-2.5 py-1.5">
          <p className="text-[10px] font-semibold text-muted-foreground">Debilidades</p>
          <p className="font-heading text-xl font-bold text-amber-600">2</p>
        </div>
      </div>
    </div>
  )
}

const PANELS = [BusinessPanel, RadiusPanel, ReportPanel]
const PANEL_WIDTHS = ['w-[56%]', 'w-[54%]', 'w-[60%]']

function HowItWorksFigure({ step = 0 }) {
  const Panel = PANELS[step]

  return (
    <div className="@container relative isolate mx-auto aspect-[5/4] w-full max-w-xl">
      <div aria-hidden="true" className="absolute inset-0 -z-10 scale-110 rounded-full bg-primary/15 blur-3xl" />

      {/* Mapa */}
      <div className="absolute bottom-0 left-[8%] w-[82%] rounded-2xl border border-border bg-card p-1.5 shadow-lg shadow-navy/5">
        <svg viewBox="40 0 400 300" className="block h-auto w-full rounded-xl" aria-hidden="true">
          <rect x="0" width="440" height="300" className="fill-secondary" />

          {/* Agua y parques */}
          <path d="M0 252 C16 244 36 250 44 264 C50 276 48 290 44 300 L0 300Z" className="fill-navy/10" />
          <path
            d="M338 244 C346 230 384 228 404 238 C422 248 420 272 402 280 C378 290 346 286 340 270 C336 262 335 252 338 244Z"
            className="fill-navy/10"
          />
          <path
            d="M30 20 C44 8 86 8 106 20 C120 30 116 56 98 66 C76 76 44 72 32 58 C22 46 22 30 30 20Z"
            className="fill-primary/15"
          />
          <rect x="214" y="200" width="34" height="30" rx="8" className="fill-primary/10" />

          {/* Calles chicas */}
          <path
            d="M-10 24 L150 22 L290 28 L450 20
              M-10 46 L120 48 L260 44 L450 52
              M-10 78 L200 80 L330 74 L450 80
              M-10 100 L90 98 L240 104 L450 100
              M-10 122 L160 126 L300 120 L450 124
              M-10 176 L110 172 L250 178 L450 170
              M-10 198 L180 202 L320 196 L450 204
              M-10 222 L100 218 L270 224 L450 216
              M-10 246 L140 250 L300 244 L450 250
              M-10 270 L200 266 L330 272 L450 266
              M-10 290 L120 294 L450 288
              M22 -10 L26 130 L20 310
              M50 -10 L54 90
              M64 112 L60 310
              M126 40 L122 310
              M152 -10 L156 160
              M208 -10 L204 310
              M236 -10 L240 120
              M244 140 L248 310
              M300 -10 L296 150 L304 310
              M330 60 L334 310
              M364 -10 L360 310
              M392 -10 L396 200
              M388 220 L392 310
              M420 -10 L424 310
              M186 310 L330 190
              M360 150 L450 130"
            fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="stroke-card"
          />

          {/* Calles secundarias */}
          <path
            d="M-10 62 L450 66
              M-10 232 L450 236
              M110 -10 L114 310
              M284 -10 L280 310"
            fill="none" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="stroke-card"
          />

          {/* Avenidas */}
          <path
            d="M-10 250 C70 214 160 190 250 130 C320 84 390 44 450 20
              M-10 140 C70 136 130 150 200 156 S340 176 450 164
              M180 -10 C176 60 194 130 188 200 S170 270 178 310
              M348 -10 L342 110 L358 210 L352 310"
            fill="none" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" className="stroke-card"
          />

          {/* Paso 2: radio */}
          {step === 1 && (
            <g key="radius" className="animate-in fade-in duration-500">
              <circle
                cx="240" cy="150" r="75" strokeWidth="2" strokeDasharray="6 5"
                className="fill-primary/15 stroke-primary"
              />
              <circle cx="240" cy="150" r="75" fill="none" strokeWidth="2" className="hero-pulse stroke-primary" />
            </g>
          )}

          {/* Paso 3: zonas */}
          {step === 2 && (
            <g key="zones" className="animate-in fade-in duration-500">
              <path
                transform="translate(-40 -25)"
                d="M215 120 C240 95 300 100 335 125 C365 150 360 200 335 225 C305 255 245 250 220 225 C195 200 190 145 215 120Z"
                strokeWidth="1.5" className="fill-primary/20 stroke-primary"
              />
            </g>
          )}

          {/* Pin compartido: punta justo en el centro del mapa */}
          {step >= 1 && <Pin x={240} y={165} className="fill-navy" />}
        </svg>
      </div>

      {/* Tarjeta que cambia con cada paso */}
      <div
        className={`hero-float absolute right-0 top-0 transition-[width] duration-500 ${PANEL_WIDTHS[step]}`}
        style={{ '--float-duration': '6s', '--float-y': '-8px' }}
      >
        <div
          key={step}
          className={cn(
            'animate-in fade-in slide-in-from-bottom-3 rounded-2xl border border-border bg-card shadow-xl shadow-navy/10 duration-500',
            step === 0 ? 'p-[2.8cqw]' : 'p-3',
          )}
        >
          <Panel />
        </div>
      </div>
    </div>
  )
}

export default HowItWorksFigure