'use client'

import dynamic from 'next/dynamic'
import { useRef } from 'react'
import type { SceneState } from '../../scroll/cheesecake-scene'
import { BASE_BG } from '../../scroll/track'

const CheesecakeRenderer = dynamic(() => import('../../scroll/cheesecake-scene').then((m) => m.CheesecakeRenderer), { ssr: false })

/**
 * Herramienta de desarrollo: renderiza el cheesecake a un tamaño fijo para
 * exportar la secuencia de imágenes. ?w=1600&h=900 fija el tamaño.
 * Se maneja desde la consola con window.__zendaExport (ver abajo).
 */
export default function RenderTool() {
  const state = useRef<SceneState>({ p: 0, reduced: true })
  const size = typeof window === 'undefined' ? { w: 1600, h: 900 } : (() => {
    const q = new URLSearchParams(window.location.search)
    return { w: Number(q.get('w') ?? 1600), h: Number(q.get('h') ?? 900) }
  })()

  if (typeof window !== 'undefined') {
    const w = window as unknown as Record<string, unknown>
    /** Exporta fotogramas de p0 a p1. Devuelve las etiquetas por fotograma. */
    w.__zendaExport = async (dir: string, p0: number, p1: number, count: number, quality = 0.82, passes = 8) => {
      const render = w.__zendaRender as (p: number, jitter?: [number, number]) => { labels: Record<string, [number, number]> }
      const src = document.querySelector('[data-render] canvas') as HTMLCanvasElement
      const out = document.createElement('canvas')
      out.width = src.width
      out.height = src.height
      const g = out.getContext('2d')!
      const frames: Record<string, [number, number]>[] = []
      for (let i = 0; i < count; i++) {
        const p = p0 + ((p1 - p0) * i) / (count - 1)
        g.globalAlpha = 1
        g.fillStyle = BASE_BG
        g.fillRect(0, 0, out.width, out.height)
        // Promedio de varias pasadas con la luz movida en un disco: sombra suave
        // de luz de ventana, sin los artefactos de las sombras filtradas
        let labels: Record<string, [number, number]> = {}
        const acc = document.createElement('canvas')
        acc.width = out.width
        acc.height = out.height
        const a = acc.getContext('2d')!
        // Cada pasada se compone sobre el fondo opaco antes de promediar, para
        // que las sombras semitransparentes no se acumulen
        const pass = document.createElement('canvas')
        pass.width = out.width
        pass.height = out.height
        const pg = pass.getContext('2d')!
        for (let k = 0; k < passes; k++) {
          const ang = (k / passes) * Math.PI * 2 + k * 2.4
          const rad = passes > 1 ? 0.9 * Math.sqrt((k + 0.5) / passes) : 0
          labels = render(p, [Math.cos(ang) * rad, Math.sin(ang) * rad]).labels
          pg.fillStyle = BASE_BG
          pg.fillRect(0, 0, pass.width, pass.height)
          pg.drawImage(src, 0, 0)
          a.globalAlpha = 1 / (k + 1)
          a.drawImage(pass, 0, 0)
        }
        g.drawImage(acc, 0, 0)
        const dataUrl = out.toDataURL('image/webp', quality)
        const name = `${String(i).padStart(4, '0')}.webp`
        await fetch('/lab/api/frame', { method: 'POST', body: JSON.stringify({ dir, name, dataUrl }) })
        frames.push(labels)
      }
      await fetch('/lab/api/frame', {
        method: 'POST',
        body: JSON.stringify({ dir, name: 'meta.json', json: { p0, p1, count, width: out.width, height: out.height, labels: frames } }),
      })
      return count
    }
  }

  return (
    <div data-render style={{ position: 'relative', width: size.w, height: size.h, background: BASE_BG }}>
      <CheesecakeRenderer state={state} width={size.w} height={size.h} />
    </div>
  )
}
