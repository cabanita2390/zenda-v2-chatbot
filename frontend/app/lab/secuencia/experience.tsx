'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { clamp01, windowOpacity } from '../scroll/track'

/**
 * Página de inicio "tipo Apple" hecha con fotogramas de video. Dos escenas
 * seguidas, cada una con su propio recorrido de scroll:
 *   1. portada → acercamiento al corte  (public/lab/seq/toma1, toma1-m)
 *   2. el pastel se desarma por capas   (public/lab/seq/toma2, toma2-m)
 * Después viene un cierre normal con los botones para pedir.
 */
const BG = '#f3f4ee'
const BG_CLEAR = 'rgba(243, 244, 238, 0)'
/** Suavizado del scroll (1 = sin suavizar). Más alto responde más rápido. */
const EASE = 0.18

interface Box {
  w: number
  cx: number
  cy: number
}

interface SceneCfg {
  id: string
  label: string
  seq: { desktop: string; mobile: string }
  /** Alto del recorrido en alturas de pantalla: más alto = el video avanza más despacio */
  trackVh: number
  /** Dónde y de qué tamaño se dibuja el fotograma (en píxeles CSS) */
  place: (vw: number, vh: number, iw: number, ih: number, portrait: boolean) => Box
}

const SCENES: SceneCfg[] = [
  {
    id: 'portada',
    label: 'Portada: un cheesecake de frutos rojos al que le falta una porción; la cámara se acerca al corte.',
    seq: { desktop: '/lab/seq/toma1', mobile: '/lab/seq/toma1-m' },
    trackVh: 420,
    place: (vw, vh, iw, ih, portrait) => {
      if (portrait) {
        const w = vw * 1.45
        return { w, cx: vw / 2 + w * (0.5 - 0.62), cy: vh * 0.64 }
      }
      // Sin estirar la imagen por encima de su tamaño real
      return { w: Math.min(vw * 0.64, iw, (vh * 0.8 * iw) / ih), cx: vw * 0.6, cy: vh * 0.54 }
    },
  },
  {
    id: 'capas',
    label: 'El mismo pastel se separa en el aire en sus cuatro capas.',
    seq: { desktop: '/lab/seq/toma2', mobile: '/lab/seq/toma2-m' },
    trackVh: 420,
    place: (vw, vh, iw, ih, portrait) => {
      if (portrait) return { w: Math.min(vw * 1.7, iw), cx: vw / 2, cy: vh * 0.6 }
      // A mitad del video las capas llegan al borde de arriba: se deja aire
      // para que el encabezado no las tape
      return { w: Math.min(iw, vw * 0.92, (vh * 0.86 * iw) / ih), cx: vw * 0.58, cy: vh * 0.555 }
    },
  },
]

/** Textos de cada escena y el tramo (0 a 1 de esa escena) en que se ven */
const COPY = [
  { id: 'hero', scene: 0, win: [0, 0.2] as const },
  { id: 'hint', scene: 0, win: [0, 0.04] as const },
  { id: 'a-mano', scene: 0, win: [0.32, 0.9] as const },
  { id: 'arma', scene: 1, win: [0, 0.42] as const },
  { id: 'que-lleva', scene: 1, win: [0.6, 1] as const },
]

/**
 * Capas de la escena 2. Las posiciones salen de medir fotogramas del video
 * (0 a 1 de la imagen): x = borde derecho de la capa, y = centro de la capa.
 * La cámara se aleja un poco al final, por eso cambian con el tiempo t.
 */
const LAYERS = [
  {
    key: 'fruta',
    title: 'Fruta fresca',
    text: 'Encima de todo, sin almíbar.',
    keys: [
      { t: 0.61, x: 0.657, y: 0.15 },
      { t: 0.732, x: 0.637, y: 0.164 },
      { t: 1, x: 0.634, y: 0.15 },
    ],
  },
  {
    key: 'cobertura',
    title: 'Endulzado con stevia',
    text: 'El dulzor viene de la fruta.',
    keys: [
      { t: 0.61, x: 0.685, y: 0.373 },
      { t: 0.732, x: 0.66, y: 0.373 },
      { t: 1, x: 0.654, y: 0.363 },
    ],
  },
  {
    key: 'relleno',
    title: 'Queso con yogur griego',
    text: 'Cremoso y liviano.',
    keys: [
      { t: 0.61, x: 0.682, y: 0.577 },
      { t: 0.732, x: 0.657, y: 0.563 },
      { t: 1, x: 0.653, y: 0.548 },
    ],
  },
  {
    key: 'base',
    title: 'Frutos secos y avena',
    text: 'En lugar de galleta.',
    keys: [
      { t: 0.61, x: 0.68, y: 0.762 },
      { t: 0.732, x: 0.655, y: 0.741 },
      { t: 1, x: 0.651, y: 0.727 },
    ],
  },
]

type Stop = { scene: number; f: number } | 'outro'
const LEGS: { id: string; label: string; to: Stop }[] = [
  { id: 'llegada', label: 'Llegada', to: { scene: 0, f: 0 } },
  { id: 'a-mano', label: 'Hecho a mano', to: { scene: 0, f: 0.62 } },
  { id: 'que-lleva', label: 'Qué lleva', to: { scene: 1, f: 1 } },
  { id: 'pedir', label: 'Pedir', to: 'outro' },
]

interface Meta {
  count: number
  width: number
  height: number
}

interface Runtime {
  meta: Meta | null
  images: HTMLImageElement[]
  ready: boolean[]
  started: boolean
  f: number
  drawn: number
  dirty: boolean
  fit: { x: number; y: number; w: number; h: number }
}

function along(keys: { t: number; x: number; y: number }[], t: number) {
  if (t <= keys[0].t) return keys[0]
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1]
    const b = keys[i]
    if (t <= b.t) {
      const k = (t - a.t) / (b.t - a.t)
      return { t, x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k }
    }
  }
  return keys[keys.length - 1]
}

export function SequenceExperience({ fontClass }: { fontClass: string }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const sceneRefs = useRef<(HTMLElement | null)[]>([])
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([])
  const outroRef = useRef<HTMLElement>(null)
  const copyRefs = useRef<Record<string, HTMLElement | null>>({})
  const layerRefs = useRef<(HTMLDivElement | null)[]>([])
  const [active, setActive] = useState(0)
  const [progress, setProgress] = useState(() => SCENES.map(() => ({ loaded: 0, total: 0 })))
  const [portrait, setPortrait] = useState(false)
  const activeRef = useRef(0)
  const reduced = useRef(false)

  const scroller = useCallback(() => rootRef.current?.closest('[data-lab-scroller]') as HTMLElement | null, [])

  const goTo = useCallback(
    (to: Stop) => {
      const s = scroller()
      const el = to === 'outro' ? outroRef.current : sceneRefs.current[to.scene]
      if (!s || !el) return
      const top = el.getBoundingClientRect().top - s.getBoundingClientRect().top + s.scrollTop
      const y = to === 'outro' ? top : top + to.f * (el.offsetHeight - s.clientHeight)
      s.scrollTo({ top: y, behavior: reduced.current ? 'auto' : 'smooth' })
    },
    [scroller],
  )

  useEffect(() => {
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isPortrait = window.innerWidth < 760 || window.innerWidth / window.innerHeight < 0.9
    setPortrait(isPortrait)
    let cancelled = false

    const rts: Runtime[] = SCENES.map(() => ({
      meta: null,
      images: [],
      ready: [],
      started: false,
      f: 0,
      drawn: -1,
      dirty: true,
      fit: { x: 0, y: 0, w: 0, h: 0 },
    }))

    const report = (si: number, loaded: number, total: number) =>
      setProgress((p) => p.map((v, i) => (i === si ? { loaded, total } : v)))

    // Carga de los fotogramas de una escena, de a 6 en paralelo
    const start = (si: number): Promise<void> => {
      const rt = rts[si]
      rt.started = true
      const dir = isPortrait ? SCENES[si].seq.mobile : SCENES[si].seq.desktop
      return fetch(`${dir}/meta.json`)
        .then((r) => r.json())
        .then(async (m: Meta) => {
          if (cancelled) return
          rt.meta = m
          let done = 0
          report(si, 0, m.count)
          const load = (i: number) =>
            new Promise<void>((resolve) => {
              const img = new Image()
              img.src = `${dir}/${String(i).padStart(4, '0')}.webp`
              img
                .decode()
                .then(() => {
                  rt.images[i] = img
                  rt.ready[i] = true
                  rt.dirty = true
                })
                .catch(() => {})
                .finally(() => {
                  done++
                  if (!cancelled && (done % 10 === 0 || done === m.count)) report(si, done, m.count)
                  resolve()
                })
            })
          // Primero el inicio y el final; después una pasada gruesa (1 de cada 16)
          // que se va afinando. Así siempre hay un cuadro cercano que mostrar,
          // aunque la conexión sea lenta o el visitante baje muy rápido.
          await Promise.all([load(0), load(m.count - 1)])
          const queue: number[] = []
          const seen = new Set([0, m.count - 1])
          for (const step of [16, 8, 4, 2, 1]) {
            for (let i = 0; i < m.count; i += step) {
              if (!seen.has(i)) {
                seen.add(i)
                queue.push(i)
              }
            }
          }
          await Promise.all(
            Array.from({ length: 6 }, async () => {
              while (queue.length && !cancelled) await load(queue.shift()!)
            }),
          )
        })
        .catch(() => {})
    }
    // Cada escena empieza a cargar cuando termina la anterior (o antes, si el
    // visitante ya se está acercando a ella)
    SCENES.reduce<Promise<void>>(
      (prev, _, si) => prev.then(() => (cancelled || rts[si].started ? undefined : start(si))),
      Promise.resolve(),
    )

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      canvasRefs.current.forEach((c, i) => {
        if (!c) return
        c.width = Math.round(c.clientWidth * dpr)
        c.height = Math.round(c.clientHeight * dpr)
        rts[i].dirty = true
      })
    }
    resize()
    window.addEventListener('resize', resize)

    const nearestReady = (rt: Runtime, i: number) => {
      if (rt.ready[i]) return i
      for (let d = 1; d < 400; d++) {
        if (rt.ready[i - d]) return i - d
        if (rt.ready[i + d]) return i + d
      }
      return -1
    }

    const draw = (si: number, rt: Runtime, c: HTMLCanvasElement, idx: number) => {
      const meta = rt.meta!
      const g = c.getContext('2d')!
      g.imageSmoothingEnabled = true
      g.imageSmoothingQuality = 'high'
      const cw = c.width
      const ch = c.height
      const iw = meta.width
      const ih = meta.height
      const dpr = cw / Math.max(1, c.clientWidth)
      const vw = cw / dpr
      const vh = ch / dpr
      const box = SCENES[si].place(vw, vh, iw, ih, isPortrait)
      const h = (box.w * ih) / iw
      const x = (box.cx - box.w / 2) * dpr
      const y = (box.cy - h / 2) * dpr
      const W = box.w * dpr
      const H = h * dpr
      g.fillStyle = BG
      g.fillRect(0, 0, cw, ch)
      g.drawImage(rt.images[idx], x, y, W, H)
      // Bordes que se funden con el fondo de la página
      const edge = (x0: number, y0: number, x1: number, y1: number, rx: number, ry: number, rw: number, rh: number) => {
        const grad = g.createLinearGradient(x0, y0, x1, y1)
        grad.addColorStop(0, BG)
        grad.addColorStop(1, BG_CLEAR)
        g.fillStyle = grad
        g.fillRect(rx, ry, rw, rh)
      }
      const fx = W * 0.12
      const fy = H * 0.12
      edge(x, 0, x + fx, 0, x - 1, y - 1, fx, H + 2)
      edge(x + W, 0, x + W - fx, 0, x + W - fx, y - 1, fx + 1, H + 2)
      edge(0, y, 0, y + fy, x - 1, y - 1, W + 2, fy)
      edge(0, y + H, 0, y + H - fy, x - 1, y + H - fy, W + 2, fy + 1)
      if (isPortrait) {
        // En celular la imagen es más ancha que la pantalla: se funde en los lados
        const s = 28 * dpr
        edge(0, 0, s, 0, 0, 0, s, ch)
        edge(cw, 0, cw - s, 0, cw - s, 0, s, ch)
      }
      rt.fit = { x: x / dpr, y: y / dpr, w: W / dpr, h: H / dpr }
      rt.drawn = idx
      rt.dirty = false
    }

    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const s = scroller()
      if (s) {
        const sRect = s.getBoundingClientRect()
        const vh = s.clientHeight
        const k = reduced.current ? 1 : 1 - Math.pow(1 - EASE, dt * 60)
        const tops: number[] = []

        SCENES.forEach((_, si) => {
          const el = sceneRefs.current[si]
          const rt = rts[si]
          if (!el) return
          const r = el.getBoundingClientRect()
          const top = r.top - sRect.top
          tops[si] = top
          if (!rt.started && top < vh * 2.5) start(si)
          const target = clamp01(-top / Math.max(1, r.height - vh))
          rt.f += (target - rt.f) * k
          if (Math.abs(target - rt.f) < 1e-5) rt.f = target
          const visible = top < vh && top + r.height > 0
          const c = canvasRefs.current[si]
          if (!visible || !c || !rt.meta) return
          const idx = nearestReady(rt, Math.round(rt.f * (rt.meta.count - 1)))
          if (idx >= 0 && (idx !== rt.drawn || rt.dirty)) draw(si, rt, c, idx)
        })

        for (const block of COPY) {
          const el = copyRefs.current[block.id]
          if (!el) continue
          const f = rts[block.scene].f
          const o = windowOpacity(f, block.win[0], block.win[1])
          const span = block.win[1] - block.win[0]
          const local = span > 0 ? (f - block.win[0]) / span : 0
          el.style.opacity = String(o)
          el.style.transform = `translateY(${(2 - 4 * clamp01(local)).toFixed(2)}vh)`
          el.style.visibility = o < 0.01 ? 'hidden' : 'visible'
          el.style.pointerEvents = o > 0.5 ? 'auto' : 'none'
        }

        // Etiquetas de capas: aparecen cuando las capas ya están separadas
        const rt = rts[1]
        const show = windowOpacity(rt.f, 0.6, 1)
        const vw = s.clientWidth
        LAYERS.forEach((l, i) => {
          const el = layerRefs.current[i]
          if (!el) return
          const st = clamp01(show * 1.6 - i * 0.14)
          el.style.opacity = String(st)
          el.style.visibility = st < 0.01 ? 'hidden' : 'visible'
          const p = along(l.keys, rt.f)
          const sx = rt.fit.x + p.x * rt.fit.w
          const sy = rt.fit.y + p.y * rt.fit.h
          if (isPortrait) {
            // Pastilla pegada al borde derecho de la capa, sin salirse de la pantalla
            const x = Math.min(sx - 28, vw - 12 - el.offsetWidth)
            el.style.transform = `translate(${x.toFixed(1)}px, ${sy.toFixed(1)}px) translateY(-50%)`
          } else {
            el.style.transform = `translate(${(sx + 14).toFixed(1)}px, ${sy.toFixed(1)}px) translateY(-50%) translateX(${((1 - st) * 10).toFixed(1)}px)`
          }
        })

        const outroTop = outroRef.current ? outroRef.current.getBoundingClientRect().top - sRect.top : Infinity
        const current = outroTop < vh * 0.55 ? 3 : tops[1] <= vh * 0.5 ? 2 : rts[0].f < 0.25 ? 0 : 1
        if (current !== activeRef.current) {
          activeRef.current = current
          setActive(current)
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [scroller])

  const setCopy = (id: string) => (el: HTMLElement | null) => {
    copyRefs.current[id] = el
  }

  const viewport = (si: number, children: React.ReactNode) => (
    <section
      key={SCENES[si].id}
      ref={(el) => {
        sceneRefs.current[si] = el
      }}
      className="sq-scene"
      aria-label={SCENES[si].label}
    >
      <div className="sx-viewport">
        <div className="sx-stage" aria-hidden>
          <canvas
            ref={(el) => {
              canvasRefs.current[si] = el
            }}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
        </div>
        <div className="sx-copy">{children}</div>
        {progress[si].total > 0 && progress[si].loaded < progress[si].total && (
          <p className="sq-loading" role="status">
            Cargando {Math.round((progress[si].loaded / progress[si].total) * 100)} %
          </p>
        )}
      </div>
      <div className="sx-spacer" style={{ height: `${SCENES[si].trackVh}vh` }} aria-hidden />
    </section>
  )

  return (
    <div ref={rootRef} className={`sx ${fontClass}`}>
      {/* Encabezado y mapa del recorrido: quedan fijos durante toda la página */}
      <div className="sq-fixed">
        <header className="sx-chrome">
          <a href="#" className="sx-wordmark" onClick={(e) => (e.preventDefault(), goTo({ scene: 0, f: 0 }))}>
            Zenda
          </a>
          <a href="/menu" className="sx-cart">
            Ver el menú
          </a>
        </header>
        <nav className="sx-map" aria-label="Recorrido">
          <ol>
            {LEGS.map((leg, i) => (
              <li key={leg.id}>
                <button type="button" aria-current={active === i ? 'step' : undefined} onClick={() => goTo(leg.to)}>
                  <span className="sx-map-dot" aria-hidden />
                  <span className="sx-map-label">{leg.label}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
      </div>

      <main>
        {viewport(
          0,
          <>
            <section ref={setCopy('hero')} className="sx-block sx-hero" aria-labelledby="sq-h1">
              <h1 id="sq-h1">Cuidarte nunca supo tan bien.</h1>
              <p>Pastelería fit de autor, hecha a mano. Base de frutos secos, endulzada con stevia y fruta fresca.</p>
              <div className="sx-actions">
                <button type="button" className="sx-btn sx-btn-primary" onClick={() => goTo({ scene: 1, f: 1 })}>
                  Ver qué lleva
                </button>
              </div>
            </section>

            <p ref={setCopy('hint')} className="sx-block sx-hint" aria-hidden>
              <span>Desliza hacia abajo</span>
              <span className="sx-hint-arrow" />
            </p>

            <section ref={setCopy('a-mano')} className="sx-block sx-left sq-narrow" aria-labelledby="sq-am">
              <h2 id="sq-am">Hecho a mano, capa por capa</h2>
              <p>Cada pastel se arma en nuestra cocina en Sogamoso, por encargo y con fruta del día.</p>
            </section>
          </>,
        )}

        {viewport(
          1,
          <>
            <section ref={setCopy('arma')} className="sx-block sx-left sq-narrow" aria-labelledby="sq-arma">
              <h2 id="sq-arma">Así se arma</h2>
              <p>Cuatro capas, una sobre otra. Cada una tiene su razón de estar ahí.</p>
            </section>

            <section ref={setCopy('que-lleva')} className="sx-block sx-left sq-narrow" aria-labelledby="sq-ql">
              <h2 id="sq-ql">Qué lleva</h2>
              <p>La receta es de la casa.</p>
            </section>

            <ul className="sq-layers" aria-label="Capas del pastel">
              {LAYERS.map((l, i) => (
                <li key={l.key}>
                  <div
                    ref={(el) => {
                      layerRefs.current[i] = el
                    }}
                    className={portrait ? 'sq-chip' : 'sq-label sq-label--right'}
                  >
                    {!portrait && <span className="sq-label-line" aria-hidden />}
                    <span className="sq-label-text">
                      <strong>{l.title}</strong>
                      <span>{l.text}</span>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </>,
        )}

        <section ref={outroRef} className="sq-outro" aria-labelledby="sq-pide">
          <h2 id="sq-pide">Pide el tuyo</h2>
          <p>Lo preparamos por encargo en Sogamoso. Mira los sabores en el menú y haz tu pedido.</p>
          <div className="sx-actions">
            <a className="sx-btn sx-btn-primary" href="/menu">
              Ver el menú
            </a>
            <a className="sx-btn sx-btn-ghost" href="/contacto">
              Escríbenos
            </a>
          </div>
        </section>
      </main>

      <footer className="sq-foot">Zenda · Pastelería fit de autor · Sogamoso, Boyacá</footer>
    </div>
  )
}
