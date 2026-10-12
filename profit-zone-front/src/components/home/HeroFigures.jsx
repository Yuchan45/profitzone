const loopStyle = (scale, duration, delay = 0) => ({
  '--loop-scale': scale,
  animationDuration: `${duration}s`,
  animationDelay: `${delay}s`,
})

function Morph({ from, to, dur = 10 }) {
  return (
    <animate
      attributeName="d"
      dur={`${dur}s`}
      repeatCount="indefinite"
      values={`${from};${from};${to};${to};${from}`}
      keyTimes="0;0.4;0.55;0.85;1"
      calcMode="spline"
      keySplines=".42 0 .58 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1"
    />
  )
}

function FloatingCard({ className = '', duration = 7, delay = 0, x = 0, y = -12, children }) {
  return (
    <div
      className={`hero-float pointer-events-auto absolute ${className}`}
      style={{
        '--float-duration': `${duration}s`,
        '--float-delay': `${delay}s`,
        '--float-x': `${x}px`,
        '--float-y': `${y}px`,
      }}
    >
      <div className="rounded-2xl border border-border bg-card p-2.5 shadow-lg shadow-navy/5 transition-[scale,box-shadow] duration-300 ease-out hover:scale-105 hover:shadow-xl hover:shadow-navy/10">
        {children}
      </div>
    </div>
  )
}

function HeroFigures() {
  return (
    <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden="true">
      {/* Izquierda arriba: dona + barras */}
      <FloatingCard className="left-[13%] top-[14%] w-[clamp(11rem,18vw,19rem)]" duration={7} y={-12}>
        <svg viewBox="0 0 300 170" className="block h-auto w-full">
          <rect width="130" height="170" rx="10" className="fill-primary/10" />
          <circle cx="65" cy="85" r="30" fill="none" strokeWidth="14" className="stroke-primary/20" />
          <circle
            cx="65" cy="85" r="30" fill="none" strokeWidth="14"
            strokeDasharray="132 188.5" transform="rotate(-90 65 85)"
            className="hero-donut-main stroke-primary"
          />
          <circle
            cx="65" cy="85" r="30" fill="none" strokeWidth="14"
            strokeDasharray="41 188.5" strokeDashoffset="-138" transform="rotate(-90 65 85)"
            className="hero-donut-accent stroke-amber-400"
          />

          <rect x="142" width="158" height="60" rx="10" className="fill-primary/5 stroke-border" />
          <rect x="211" y="18" width="16" height="16" rx="3" className="fill-primary/30" />
          <rect x="190" y="42" width="60" height="4" rx="2" className="fill-primary/30" />

          <rect x="142" y="70" width="158" height="100" rx="10" className="fill-primary/5 stroke-border" />
          <rect x="164" y="118" width="16" height="32" rx="3" className="hero-bar fill-primary/30" style={loopStyle(1.8, 8, 0)} />
          <rect x="190" y="98" width="16" height="52" rx="3" className="hero-bar fill-primary" style={loopStyle(0.6, 10, -3)} />
          <rect x="216" y="82" width="16" height="68" rx="3" className="hero-bar fill-primary" style={loopStyle(0.55, 9, -5)} />
          <rect x="242" y="110" width="16" height="40" rx="3" className="hero-bar fill-amber-400" style={loopStyle(1.6, 11, -2)} />
          <rect x="268" y="96" width="16" height="54" rx="3" className="hero-bar fill-primary/30" style={loopStyle(0.5, 7, -6)} />
        </svg>
      </FloatingCard>

      {/* Izquierda abajo: mapa con zona y pin */}
      <FloatingCard
        className="bottom-[23%] left-[7%] w-[clamp(12rem,20vw,22rem)]"
        duration={8} delay={-2} y={10}
      >
        <svg viewBox="0 0 300 190" className="block h-auto w-full rounded-xl">
          <rect width="300" height="190" className="fill-primary/10" />
          <path
            d="M0 55 H300 M0 125 H300 M75 0 V190 M215 0 V190 M0 170 L300 100"
            fill="none" strokeWidth="7" className="stroke-card"
          />
          <circle
            cx="150" cy="92" r="58" strokeWidth="2" strokeDasharray="6 5"
            className="fill-primary/20 stroke-primary"
          />
          <circle cx="150" cy="92" r="58" fill="none" strokeWidth="2" className="hero-pulse stroke-primary" />
          <g transform="translate(150 98)">
            <path d="M0 14 C-10 2 -13 -2 -13 -9 A13 13 0 0 1 13 -9 C13 -2 10 2 0 14Z" className="fill-navy" />
            <circle cy="-9" r="5" className="fill-card" />
          </g>
        </svg>
      </FloatingCard>

      {/* Izquierda abajo (superpuesta): burbujas */}
      <FloatingCard
        className="bottom-[15%] left-[22%] w-[clamp(6rem,9vw,10rem)]"
        duration={6} delay={-1} x={6} y={-10}
      >
        <svg viewBox="0 0 150 130" className="block h-auto w-full">
          <path d="M8 65 H142 M75 8 V122" fill="none" strokeWidth="1" className="stroke-border" />
          <circle cx="75" cy="65" r="22" className="hero-breathe fill-primary/30" style={loopStyle(0.7, 9, 0)} />
          <circle cx="104" cy="70" r="9" className="hero-breathe fill-primary" style={loopStyle(1.6, 7, -2)} />
          <circle cx="42" cy="48" r="7" className="hero-breathe fill-primary/20" style={loopStyle(1.7, 11, -5)} />
          <circle cx="32" cy="100" r="5" className="hero-breathe fill-amber-400" style={loopStyle(1.8, 8, -3)} />
          <circle cx="116" cy="40" r="6" className="hero-breathe fill-amber-400" style={loopStyle(0.6, 10, -6)} />
          <circle cx="75" cy="20" r="4" className="fill-primary" />
          <circle cx="75" cy="110" r="4" className="fill-primary/30" />
        </svg>
      </FloatingCard>

      {/* Derecha arriba: gráfico de línea */}
      <FloatingCard
        className="right-[11%] top-[18%] w-[clamp(12rem,19vw,21rem)]"
        duration={9} delay={-4} y={12}
      >
        <svg viewBox="0 0 300 150" className="block h-auto w-full rounded-xl">
          <rect x="8" y="8" width="64" height="5" rx="2.5" className="fill-primary/25" />
          <rect x="88" y="8" width="40" height="5" rx="2.5" className="fill-primary/25" />
          <path d="M0 95 L50 78 L110 88 L170 58 L230 44 L300 30 V150 H0Z" className="fill-primary/15">
          <Morph
            from="M0 95 L50 78 L110 88 L170 58 L230 44 L300 30 V150 H0Z"
            to="M0 84 L50 92 L110 66 L170 74 L230 40 L300 46 V150 H0Z"
          />
          </path>
          <path
            d="M0 95 L50 78 L110 88 L170 58 L230 44 L300 30"
            fill="none" strokeWidth="2.5" strokeLinejoin="round" className="stroke-primary"
          >
            <Morph
              from="M0 95 L50 78 L110 88 L170 58 L230 44 L300 30"
              to="M0 84 L50 92 L110 66 L170 74 L230 40 L300 46"
            />
          </path>
          <path
            d="M0 122 L50 112 L110 124 L170 98 L230 76 L300 86"
            fill="none" strokeWidth="2.5" strokeDasharray="7 6" className="hero-dash stroke-amber-400"
          >
            <Morph
              from="M0 122 L50 112 L110 124 L170 98 L230 76 L300 86"
              to="M0 110 L50 120 L110 98 L170 108 L230 80 L300 70"
            />
          </path>
        </svg>
      </FloatingCard>

      {/* Derecha abajo: mapa con puntos + lista */}
      <FloatingCard
        className="bottom-[26%] right-[7%] w-[clamp(13rem,22vw,24rem)]"
        duration={7.5} delay={-3} y={-10}
      >
        <svg viewBox="0 0 340 160" className="block h-auto w-full">
          <rect width="245" height="160" rx="10" className="fill-primary/10" />
          <path
            d="M0 45 H245 M0 105 H245 M70 0 V160 M165 0 V160 M0 150 L245 70"
            fill="none" strokeWidth="6" className="stroke-card"
          />
          <circle cx="60" cy="115" r="14" className="hero-breathe fill-primary" style={loopStyle(0.7, 9, 0)} />
          <circle cx="110" cy="60" r="7" className="hero-breathe fill-amber-400" style={loopStyle(1.7, 7, -2)} />
          <circle cx="132" cy="100" r="4" className="hero-breathe fill-navy" style={loopStyle(2, 10, -4)} />
          <circle cx="170" cy="118" r="10" className="hero-breathe fill-primary/30" style={loopStyle(1.5, 8, -6)} />
          <circle cx="190" cy="40" r="11" fill="none" strokeWidth="2" className="hero-breathe stroke-amber-400" style={loopStyle(0.7, 9, -3)} />
          <circle cx="190" cy="40" r="11" fill="none" strokeWidth="2" className="hero-pulse stroke-amber-400" />

          <rect x="255" width="85" height="160" rx="10" className="fill-card stroke-border" />
          {[0, 1, 2, 3, 4].map((i) => {
            const dur = 4 + i * 0.5
            return (
              <g key={i}>
                <circle cx="273" cy={32 + i * 24} r="3.5" className="fill-primary" />
                <rect x="286" y={30 + i * 24} width="40" height="4" rx="2" className="fill-primary/25">
                  <animate
                    attributeName="width"
                    values="22;44;22"
                    dur={`${dur}s`}
                    begin={`${i % 2 ? -dur / 2 : 0}s`}
                    repeatCount="indefinite"
                    calcMode="spline"
                    keySplines=".42 0 .58 1;.42 0 .58 1"
                  />
                </rect>
              </g>
            )
          })}
        </svg>
      </FloatingCard>
    </div>
  )
}

export default HeroFigures