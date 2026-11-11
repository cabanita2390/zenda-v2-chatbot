'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useCart } from '@/lib/cart-context'
import { CATEGORIES, INGREDIENTS, MENU, ORDER_STEPS, PRICES, formatCOP, type Category, type MenuItem } from './data'

/**
 * Página de inicio por secciones. Lo especial:
 *  - Portada con un collage de postres que se mueve a distinta velocidad (parallax).
 *  - "Qué lleva": el video del pastel desarmándose queda fijo detrás y avanza con
 *    el scroll, mientras las tarjetas de ingredientes pasan por encima.
 */
const BG = '#f3f4ee'
const BG_CLEAR = 'rgba(243, 244, 238, 0)'
const SEQ = { desktop: '/lab/seq/toma2', mobile: '/lab/seq/toma2-m' }
const EASE = 0.16

const NAV = [
  { id: 'menu', label: 'Menú' },
  { id: 'que-lleva', label: 'Qué lleva' },
  { id: 'encargos', label: 'Encargos' },
  { id: 'nosotros', label: 'Nosotros' },
]

/** Fotos de la portada: depth = qué tan rápido suben al hacer scroll */
const COLLAGE = [
  { src: '/lab/inicio/uchuva.webp', alt: 'Cheesecake de uchuva entero', className: 'zi-c1', depth: 0.08 },
  { src: '/lab/inicio/parfait.webp', alt: 'Parfait de chía y bayas en frasco', className: 'zi-c2', depth: 0.22 },
  { src: '/lab/inicio/chocolate.webp', alt: 'Tarta de chocolate negro con frutos rojos', className: 'zi-c3', depth: 0.15 },
]

interface Meta {
  count: number
  width: number
  height: number
}

const SINGULAR: Record<Category, string> = { Cheesecakes: 'Cheesecake', Tartas: 'Tarta', Vasitos: 'Vasito', Horneados: 'Horneado' }

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

export function HomeExperience({ fontClass }: { fontClass: string }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const storyRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const collageRefs = useRef<(HTMLDivElement | null)[]>([])
  const reduced = useRef(false)
  const { addToCart, totalItems } = useCart()
  const [filter, setFilter] = useState<(typeof CATEGORIES)[number]>('Todo')
  const [added, setAdded] = useState<number | null>(null)

  const scroller = useCallback(() => rootRef.current?.closest('[data-lab-scroller]') as HTMLElement | null, [])

  const goTo = useCallback(
    (id: string) => {
      const s = scroller()
      const el = document.getElementById(id)
      if (!s || !el) return
      const top = el.getBoundingClientRect().top - s.getBoundingClientRect().top + s.scrollTop - 64
      s.scrollTo({ top: id === 'inicio' ? 0 : top, behavior: reduced.current ? 'auto' : 'smooth' })
    },
    [scroller],
  )

  const add = (item: MenuItem) => {
    addToCart({ id: item.id, name: item.name, price: item.price, tag: item.category, image: item.image })
    setAdded(item.id)
    window.setTimeout(() => setAdded((v) => (v === item.id ? null : v)), 1600)
  }

  useEffect(() => {
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isPortrait = window.innerWidth < 760 || window.innerWidth / window.innerHeight < 0.9
    let cancelled = false
    let meta: Meta | null = null
    const images: HTMLImageElement[] = []
    const ready: boolean[] = []
    let started = false
    let dirty = true

    // Fotogramas del video: inicio y final primero, después de lo grueso a lo fino
    const start = () => {
      started = true
      const dir = isPortrait ? SEQ.mobile : SEQ.desktop
      fetch(`${dir}/meta.json`)
        .then((r) => r.json())
        .then(async (m: Meta) => {
          if (cancelled) return
          meta = m
          const load = (i: number) =>
            new Promise<void>((resolve) => {
              const im = new window.Image()
              im.src = `${dir}/${String(i).padStart(4, '0')}.webp`
              im.decode()
                .then(() => {
                  images[i] = im
                  ready[i] = true
                  dirty = true
                })
                .catch(() => {})
                .finally(resolve)
            })
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
    // Empieza a cargar cuando la página ya respondió, sin competir con la portada
    const idle = window.setTimeout(() => !started && start(), 1200)

    const resize = () => {
      const c = canvasRef.current
      if (!c) return
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      c.width = Math.round(c.clientWidth * dpr)
      c.height = Math.round(c.clientHeight * dpr)
      dirty = true
    }
    resize()
    window.addEventListener('resize', resize)

    const nearestReady = (i: number) => {
      if (ready[i]) return i
      for (let d = 1; d < 400; d++) {
        if (ready[i - d]) return i - d
        if (ready[i + d]) return i + d
      }
      return -1
    }

    const draw = (c: HTMLCanvasElement, idx: number) => {
      const m = meta!
      const g = c.getContext('2d')!
      g.imageSmoothingEnabled = true
      g.imageSmoothingQuality = 'high'
      const cw = c.width
      const ch = c.height
      const dpr = cw / Math.max(1, c.clientWidth)
      const vw = cw / dpr
      const vh = ch / dpr
      const iw = m.width
      const ih = m.height
      // Nunca más grande que el tamaño real del video
      const w = isPortrait ? Math.min(iw, vw * 1.5) : Math.min(iw, vw * 0.8, (vh * 0.9 * iw) / ih)
      const cx = isPortrait ? vw / 2 : vw * 0.66
      const cy = isPortrait ? vh * 0.4 : vh * 0.52
      const h = (w * ih) / iw
      const x = (cx - w / 2) * dpr
      const y = (cy - h / 2) * dpr
      const W = w * dpr
      const H = h * dpr
      g.fillStyle = BG
      g.fillRect(0, 0, cw, ch)
      g.drawImage(images[idx], x, y, W, H)
      const edge = (x0: number, y0: number, x1: number, y1: number, rx: number, ry: number, rw: number, rh: number) => {
        const grad = g.createLinearGradient(x0, y0, x1, y1)
        grad.addColorStop(0, BG)
        grad.addColorStop(1, BG_CLEAR)
        g.fillStyle = grad
        g.fillRect(rx, ry, rw, rh)
      }
      const fx = W * 0.14
      const fy = H * 0.2
      edge(x, 0, x + fx, 0, x - 1, y - 1, fx, H + 2)
      edge(x + W, 0, x + W - fx, 0, x + W - fx, y - 1, fx + 1, H + 2)
      edge(0, y, 0, y + fy, x - 1, y - 1, W + 2, fy)
      edge(0, y + H, 0, y + H - fy, x - 1, y + H - fy, W + 2, fy + 1)
      if (isPortrait) {
        const s = 28 * dpr
        edge(0, 0, s, 0, 0, 0, s, ch)
        edge(cw, 0, cw - s, 0, cw - s, 0, s, ch)
      }
      drawn = idx
      dirty = false
    }

    let f = 0
    let drawn = -1
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const s = scroller()
      const story = storyRef.current
      if (s && story) {
        const vh = s.clientHeight
        const sTop = s.getBoundingClientRect().top

        // Parallax de la portada
        if (!reduced.current && s.scrollTop < vh * 1.5) {
          COLLAGE.forEach((c, i) => {
            const el = collageRefs.current[i]
            if (el) el.style.transform = `translate3d(0, ${(-s.scrollTop * c.depth).toFixed(1)}px, 0)`
          })
        }

        // Video detrás de "Qué lleva"
        const r = story.getBoundingClientRect()
        const top = r.top - sTop
        if (!started && top < vh * 2.5) start()
        const target = clamp01(-top / Math.max(1, r.height - vh))
        const k = reduced.current ? 1 : 1 - Math.pow(1 - EASE, dt * 60)
        f += (target - f) * k
        if (Math.abs(target - f) < 1e-5) f = target
        const c = canvasRef.current
        const visible = top < vh && top + r.height > 0
        if (visible && c && meta) {
          const idx = nearestReady(Math.round(f * (meta.count - 1)))
          if (idx >= 0 && (idx !== drawn || dirty)) draw(c, idx)
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelled = true
      window.clearTimeout(idle)
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [scroller])

  const shown = filter === 'Todo' ? MENU : MENU.filter((m) => m.category === (filter as Category))
  const navClick = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    goTo(id)
  }

  return (
    <div ref={rootRef} className={`zi ${fontClass}`}>
      <a className="zi-skip" href="#menu" onClick={navClick('menu')}>
        Saltar al menú
      </a>

      <header className="zi-header">
        <a href="#inicio" className="zi-wordmark" onClick={navClick('inicio')} aria-label="Zenda, inicio">
          Zenda
        </a>
        <nav className="zi-nav" aria-label="Principal">
          {NAV.map((n) => (
            <a key={n.id} href={`#${n.id}`} onClick={navClick(n.id)}>
              {n.label}
            </a>
          ))}
        </nav>
        <span className="zi-cart" aria-live="polite">
          Carrito <span className="zi-cart-count">{totalItems}</span>
        </span>
      </header>

      <main>
        {/* Portada */}
        <section id="inicio" className="zi-hero" aria-labelledby="zi-h1">
          <div className="zi-hero-copy">
            <p className="zi-eyebrow">Pastelería fit de autor · Sogamoso</p>
            <h1 id="zi-h1">Cuidarte nunca supo tan bien.</h1>
            <p className="zi-lead">
              Cheesecakes, tartas, vasitos y horneados hechos a mano. Endulzados con stevia y fruta fresca, sin perder el gusto.
            </p>
            <div className="zi-actions">
              <a href="#menu" className="zi-btn zi-btn-primary" onClick={navClick('menu')}>
                Ver el menú
              </a>
              <a href="#encargos" className="zi-btn zi-btn-ghost" onClick={navClick('encargos')}>
                Encargar una torta
              </a>
            </div>
          </div>
          <div className="zi-collage" aria-hidden>
            {COLLAGE.map((c, i) => (
              <div
                key={c.src}
                ref={(el) => {
                  collageRefs.current[i] = el
                }}
                className={`zi-photo ${c.className}`}
              >
                <Image src={c.src} alt="" fill priority={i === 0} sizes="(max-width: 760px) 60vw, 30vw" />
              </div>
            ))}
          </div>
        </section>

        {/* Líneas */}
        <section className="zi-lines" aria-label="Líneas de Zenda">
          <div className="zi-line">
            <h2>Zenda Dulce</h2>
            <p>Postres y tortas, todos los días.</p>
            <span className="zi-tag zi-tag-on">Disponible</span>
          </div>
          <div className="zi-line">
            <h2>Zenda Sal</h2>
            <p>Horneados salados con la misma idea.</p>
            <span className="zi-tag">Muy pronto</span>
          </div>
        </section>

        {/* Menú */}
        <section id="menu" className="zi-section" aria-labelledby="zi-menu-title">
          <div className="zi-section-head">
            <h2 id="zi-menu-title">El menú</h2>
            <p>Porciones individuales. Escoge las tuyas y te las llevamos.</p>
          </div>
          <div className="zi-filters" role="group" aria-label="Filtrar por tipo">
            {CATEGORIES.map((c) => (
              <button key={c} type="button" aria-pressed={filter === c} onClick={() => setFilter(c)}>
                {c}
              </button>
            ))}
          </div>
          <ul className="zi-grid">
            {shown.map((item) => (
              <li key={item.id} className="zi-card">
                <div className="zi-card-media">
                  <Image src={item.image} alt={item.name} fill sizes="(max-width: 760px) 50vw, (max-width: 1100px) 33vw, 25vw" />
                </div>
                <div className="zi-card-body">
                  <p className="zi-card-cat">{SINGULAR[item.category]}</p>
                  <h3>{item.name}</h3>
                  <p className="zi-card-note">{item.note}</p>
                  <div className="zi-card-foot">
                    <span className="zi-price">{formatCOP(item.price)}</span>
                    <button
                      type="button"
                      className={`zi-add${added === item.id ? ' is-added' : ''}`}
                      onClick={() => add(item)}
                      aria-label={`Agregar ${item.name} al carrito`}
                    >
                      {added === item.id ? 'Agregado' : 'Agregar'}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Qué lleva: video fijo detrás, tarjetas encima */}
        <section id="que-lleva" ref={storyRef} className="zi-story" aria-labelledby="zi-ql-title">
          <div className="zi-story-stage" aria-hidden>
            <canvas ref={canvasRef} />
          </div>
          <div className="zi-story-content">
            <div className="zi-story-intro">
              <h2 id="zi-ql-title">Qué lleva</h2>
              <p>La receta es de la casa, pero te contamos qué lleva. Desliza y mira cómo se arma.</p>
            </div>
            <ol className="zi-story-cards">
              {INGREDIENTS.map((it, i) => (
                <li key={it.title} className="zi-story-card">
                  <span className="zi-story-num">{String(i + 1).padStart(2, '0')}</span>
                  <h3>{it.title}</h3>
                  <p>{it.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Encargos */}
        <section id="encargos" className="zi-orders" aria-labelledby="zi-enc-title">
          <div className="zi-orders-intro">
            <h2 id="zi-enc-title">Tortas para tus fechas especiales</h2>
            <p>Cumpleaños, aniversarios o un martes que merece algo rico. Tú eliges el sabor y la hora; nosotros la hacemos a mano.</p>
            <p className="zi-orders-prices">
              <span>Tortas desde {formatCOP(PRICES.cake)}</span>
              <span>Cheesecake entero desde {formatCOP(PRICES.wholeCheesecake)}</span>
              <span>Envío en Sogamoso {formatCOP(PRICES.shipping)}</span>
            </p>
            <a href="/contacto" className="zi-btn zi-btn-primary">
              Encargar una torta
            </a>
          </div>
          <ol className="zi-steps">
            {ORDER_STEPS.map((s, i) => (
              <li key={s.title}>
                <span className="zi-step-num">{i + 1}</span>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Nosotros */}
        <section id="nosotros" className="zi-section zi-about" aria-labelledby="zi-nos-title">
          <h2 id="zi-nos-title">Hecho a mano en Sogamoso</h2>
          <div className="zi-about-grid">
            <p className="zi-about-lead">
              Una cocina pequeña, recetas propias y fruta de temporada. Cada pieza sale de nuestras manos, nunca de una fábrica.
            </p>
            <dl className="zi-facts">
              <div>
                <dt>Equilibrio</dt>
                <dd>Ni restricción ni exceso. Comer bien no es dejar de comer.</dd>
              </div>
              <div>
                <dt>Honestidad</dt>
                <dd>Te decimos qué lleva y cobramos lo justo.</dd>
              </div>
              <div>
                <dt>Sabor primero</dt>
                <dd>Si no es exquisito, no sale de la cocina.</dd>
              </div>
            </dl>
          </div>
        </section>
      </main>

      <footer className="zi-footer">
        <div>
          <p className="zi-wordmark">Zenda</p>
          <p>Pastelería fit de autor.</p>
        </div>
        <div>
          <h2>Visítanos</h2>
          <p>Sogamoso, Boyacá</p>
          <p>
            <a href="/contacto">Escríbenos</a>
          </p>
        </div>
        <div>
          <h2>Horario</h2>
          <p>Lunes a sábado, 8:00 a. m. a 7:00 p. m.</p>
          <p>Domingo, con encargo previo</p>
        </div>
        <p className="zi-legal">© 2026 Zenda</p>
      </footer>
    </div>
  )
}
