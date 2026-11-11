'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { SceneState } from './cheesecake-scene'
import { BASE_BG, FLAVORS, LEGS, TRACK_VH, flavorWeights, kf, T, tintStrength, windowOpacity } from './track'

const CheesecakeScene = dynamic(() => import('./cheesecake-scene'), { ssr: false })

/** Bloques de copy: viven en una capa fija y aparecen en su ventana del recorrido. */
const COPY = [
  { id: 'hero', win: [0, 0.085] as const, place: 'hero' },
  { id: 'hint', win: [0, 0.03] as const, place: 'hint' },
  { id: 'que-lleva', win: [0.2, 0.39] as const, place: 'left' },
  { id: 'se-arma', win: [0.415, 0.535] as const, place: 'left' },
  { id: 'sabores', win: [0.56, 0.775] as const, place: 'top' },
  { id: 'encargos', win: [0.79, 0.905] as const, place: 'left' },
  { id: 'final', win: [0.93, 1] as const, place: 'final' },
]

function mix(hexA: string, hexB: string, t: number) {
  const a = parseInt(hexA.slice(1), 16)
  const b = parseInt(hexB.slice(1), 16)
  const ch = (shift: number) => Math.round(((a >> shift) & 255) * (1 - t) + ((b >> shift) & 255) * t)
  return `rgb(${ch(16)}, ${ch(8)}, ${ch(0)})`
}

export function ScrollExperience({ fontClass }: { fontClass: string }) {
  const state = useRef<SceneState>({ p: 0, reduced: false })
  const rootRef = useRef<HTMLDivElement>(null)
  const copyRefs = useRef<Record<string, HTMLElement | null>>({})
  const [active, setActive] = useState(0)
  const activeRef = useRef(0)

  const scroller = useCallback(() => rootRef.current?.closest('[data-lab-scroller]') as HTMLElement | null, [])

  const goTo = useCallback(
    (fraction: number) => {
      const s = scroller()
      if (!s) return
      const max = s.scrollHeight - s.clientHeight
      s.scrollTo({ top: fraction * max, behavior: state.current.reduced ? 'auto' : 'smooth' })
    },
    [scroller],
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    state.current.reduced = mq.matches
    const onMq = () => (state.current.reduced = mq.matches)
    mq.addEventListener('change', onMq)

    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const s = scroller()
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (s) {
        const max = Math.max(1, s.scrollHeight - s.clientHeight)
        const target = Math.min(1, Math.max(0, s.scrollTop / max))
        const k = state.current.reduced ? 1 : 1 - Math.pow(1 - 0.12, dt * 60)
        state.current.p += (target - state.current.p) * k
        if (Math.abs(target - state.current.p) < 1e-5) state.current.p = target
      }
      const p = state.current.p

      // Copy: meseta de opacidad y desplazamiento vertical de 4vh como máximo
      for (const block of COPY) {
        const el = copyRefs.current[block.id]
        if (!el) continue
        const o = windowOpacity(p, block.win[0], block.win[1])
        const span = block.win[1] - block.win[0]
        const local = span > 0 ? (p - block.win[0]) / span : 0
        el.style.opacity = String(o)
        el.style.transform = `translateY(${(2 - 4 * Math.min(1, Math.max(0, local))).toFixed(2)}vh)`
        el.style.visibility = o < 0.01 ? 'hidden' : 'visible'
        el.style.pointerEvents = o > 0.5 ? 'auto' : 'none'
      }

      // El mundo cambia de tono con cada sabor
      const root = rootRef.current
      if (root) {
        const w = flavorWeights(p, kf(p, T.cakeX))
        const strength = tintStrength(p)
        const rgb = [0, 0, 0]
        w.forEach((wi, i) => {
          const c = parseInt(FLAVORS[i].tint.slice(1), 16)
          rgb[0] += ((c >> 16) & 255) * wi
          rgb[1] += ((c >> 8) & 255) * wi
          rgb[2] += (c & 255) * wi
        })
        const tint = '#' + rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')
        root.style.setProperty('--sx-ground', mix(BASE_BG, tint, strength))
      }

      // Tramo actual para el mapa
      const idx = LEGS.findIndex((l) => p >= l.from && p < l.to)
      const current = idx === -1 ? LEGS.length - 1 : idx
      if (current !== activeRef.current) {
        activeRef.current = current
        setActive(current)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      mq.removeEventListener('change', onMq)
    }
  }, [scroller])

  const setCopy = (id: string) => (el: HTMLElement | null) => {
    copyRefs.current[id] = el
  }

  return (
    <div ref={rootRef} className={`sx ${fontClass}`}>
      <a className="sx-skip" href="#sx-final">
        Saltar al pedido
      </a>

      <div className="sx-viewport">
      {/* Escenario fijo: el único mundo de la página */}
      <div className="sx-stage" aria-hidden>
        <CheesecakeScene state={state} onCta={() => goTo(1)} />
      </div>

      {/* Chrome: marca, mapa del recorrido y carrito */}
      <header className="sx-chrome">
        <a href="#" className="sx-wordmark" onClick={(e) => (e.preventDefault(), goTo(0))}>
          Zenda
        </a>
        <a href="#" className="sx-cart">
          Carrito (0)
        </a>
      </header>
      <nav className="sx-map" aria-label="Recorrido">
        <ol>
          {LEGS.map((leg, i) => (
            <li key={leg.id}>
              <button
                type="button"
                aria-current={active === i ? 'step' : undefined}
                onClick={() => goTo(leg.from + (leg.to - leg.from) * (i === 0 ? 0 : 0.55))}
              >
                <span className="sx-map-dot" aria-hidden />
                <span className="sx-map-label">{leg.label}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      {/* Capa de copy fija */}
      <main className="sx-copy">
        <section ref={setCopy('hero')} className="sx-block sx-hero" aria-labelledby="sx-h1">
          <h1 id="sx-h1">Cuidarte nunca supo tan bien.</h1>
          <p>Pastelería fit de autor, hecha a mano. Base de frutos secos, endulzada con stevia y fruta fresca.</p>
          <div className="sx-actions">
            <button type="button" className="sx-btn sx-btn-primary" onClick={() => goTo(0.62)}>
              Ver los sabores
            </button>
            <button type="button" className="sx-btn sx-btn-ghost" onClick={() => goTo(0.85)}>
              Encargar una torta
            </button>
          </div>
        </section>

        <p ref={setCopy('hint')} className="sx-block sx-hint" aria-hidden>
          <span>Desliza hacia abajo</span>
          <span className="sx-hint-arrow" />
        </p>

        <section ref={setCopy('que-lleva')} className="sx-block sx-left" aria-labelledby="sx-ql">
          <h2 id="sx-ql">Qué lleva</h2>
          <p>La receta es de la casa, pero te contamos qué lleva cada capa.</p>
        </section>

        <section ref={setCopy('se-arma')} className="sx-block sx-left" aria-labelledby="sx-sa">
          <h2 id="sx-sa">Hecho a mano, capa por capa</h2>
          <p>Primero la base, luego el relleno y al final la fruta. Cada pastel se arma en nuestra cocina, por encargo.</p>
        </section>

        <section ref={setCopy('sabores')} className="sx-block sx-top" aria-labelledby="sx-sb">
          <h2 id="sx-sb">Elige tu sabor</h2>
          <p>Porción a $14.000. Entero de 22 cm a $95.000.</p>
        </section>

        <section ref={setCopy('encargos')} className="sx-block sx-left" aria-labelledby="sx-en">
          <h2 id="sx-en">Tortas para tus fechas especiales</h2>
          <ol className="sx-steps">
            <li>
              <span>
                <strong>Pide con 12 horas de anticipación.</strong> Así la preparamos fresca, solo para ti.
              </span>
            </li>
            <li>
              <span>
                <strong>Elige la hora de entrega.</strong> Llega a la hora exacta que necesites.
              </span>
            </li>
            <li>
              <span>
                <strong>Recíbela en tu puerta.</strong> El envío se cobra aparte y lo ves antes de confirmar.
              </span>
            </li>
          </ol>
        </section>

        <section id="sx-final" ref={setCopy('final')} className="sx-block sx-final" aria-labelledby="sx-fi">
          <h2 id="sx-fi">Cuidarte nunca supo tan bien.</h2>
          <p>Hecho a mano en Sogamoso. Lunes a sábado, 8:00 a. m. a 7:00 p. m.</p>
          <button type="button" className="sx-link" onClick={() => goTo(0.85)}>
            ¿Es para una fecha especial? Encarga una torta entera.
          </button>
        </section>
      </main>
      </div>

      {/* Lo único en el flujo del documento: el espaciador que da largo al recorrido */}
      <div className="sx-spacer" style={{ height: `${TRACK_VH}vh` }} aria-hidden />
    </div>
  )
}
