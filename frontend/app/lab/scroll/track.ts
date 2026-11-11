/**
 * Partitura del mundo continuo: una sola línea de tiempo (p de 0 a 1) para todo
 * el recorrido. Cada propiedad del cheesecake es una lista de keyframes [p, valor].
 */

import type { PieceShape } from './cake-parts'

export type Frames = readonly (readonly [number, number])[]

export const smooth = (t: number) => t * t * (3 - 2 * t)
export const clamp01 = (t: number) => Math.min(1, Math.max(0, t))
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Interpola keyframes con easing suave en cada tramo. */
export function kf(p: number, frames: Frames): number {
  if (p <= frames[0][0]) return frames[0][1]
  for (let i = 1; i < frames.length; i++) {
    const [p1, v1] = frames[i]
    if (p <= p1) {
      const [p0, v0] = frames[i - 1]
      const t = p1 === p0 ? 1 : smooth((p - p0) / (p1 - p0))
      return lerp(v0, v1, t)
    }
  }
  return frames[frames.length - 1][1]
}

/** Opacidad de una ventana de copy con meseta (ramp 30 % a cada lado). */
export function windowOpacity(p: number, a: number, b: number, ramp = 0.3) {
  if (a <= 0 && p <= b) {
    const out = b - (b - a) * ramp
    return p < out ? 1 : 1 - smooth(clamp01((p - out) / (b - out)))
  }
  if (b >= 1 && p >= a) {
    const inEnd = a + (b - a) * ramp
    return smooth(clamp01((p - a) / (inEnd - a)))
  }
  const span = b - a
  const r = span * ramp
  if (p <= a || p >= b) return 0
  if (p < a + r) return smooth((p - a) / r)
  if (p > b - r) return smooth((b - p) / r)
  return 1
}

/** Tramos del recorrido (la cumbre es el más largo). */
export const LEGS = [
  { id: 'llegada', label: 'Llegada', from: 0, to: 0.12 },
  { id: 'que-lleva', label: 'Qué lleva', from: 0.12, to: 0.4 },
  { id: 'se-arma', label: 'Se arma', from: 0.4, to: 0.54 },
  { id: 'sabores', label: 'Sabores', from: 0.54, to: 0.78 },
  { id: 'encargos', label: 'Encargos', from: 0.78, to: 0.9 },
  { id: 'tu-porcion', label: 'Tu porción', from: 0.9, to: 1 },
] as const

/** Alto total del recorrido, en alturas de pantalla. */
export const TRACK_VH = 1050

// ── Cheesecake ──────────────────────────────────────────────────────────────

export const T = {
  cakeX: [
    [0, 1.25],
    [0.13, 1.25],
    [0.22, -0.35],
    [0.4, -0.35],
    [0.48, 0],
    [0.54, 0],
    [0.585, -2.4],
    [0.755, 2.4],
    [0.8, 1.1],
    [0.9, 1.1],
    [0.97, 0.55],
  ],
  cakeY: [
    [0, 0],
    [0.16, 0],
    [0.26, 0.15],
    [0.4, 0.15],
    [0.46, 0],
  ],
  cakeScale: [
    [0, 1],
    [0.78, 1],
    [0.84, 1.12],
    [0.9, 1.12],
    [0.97, 1],
  ],
  rotX: [
    [0, 0],
    [0.18, 0],
    [0.27, -0.1],
    [0.4, -0.1],
    [0.46, 0],
  ],
  rotY: [
    [0, -0.55],
    [0.12, -0.2],
    [0.27, -0.75],
    [0.4, -0.35],
    [0.54, 0.4],
    [0.78, 0.4 + Math.PI * 2],
    [0.9, 0.1 + Math.PI * 2],
    [1, -0.45 + Math.PI * 2],
  ],
  // Separación de capas (cumbre) y caída en orden (se arma)
  fillOff: [
    [0.16, 0],
    [0.27, 0.62],
    [0.4, 0.62],
    [0.455, 0],
  ],
  topOff: [
    [0.16, 0],
    [0.27, 1.25],
    [0.4, 1.25],
    [0.43, 1.55],
    [0.49, 0],
  ],
  fruitOff: [
    [0.16, 0],
    [0.27, 1.95],
    [0.4, 1.95],
    [0.46, 2.9],
    [0.53, 0],
  ],
  layerTwist: [
    [0.16, 0],
    [0.27, 1],
    [0.4, 1],
    [0.47, 0],
  ],
  // La porción: 0 = en su lugar frente al pastel, 1 = libre
  wedgeFree: [
    [0, 0],
    [0.15, 0],
    [0.25, 1],
  ],
  wedgePull: [
    [0, 0.42],
    [0.12, 0.42],
    [0.15, 0.7],
  ],
  wedgeLand: [
    [0.9, 0],
    [0.975, 1],
  ],
  plate2: [
    [0.9, 0],
    [0.95, 1],
  ],
  // Cámara
  camZ: [
    [0, 7.4],
    [0.16, 7.4],
    [0.27, 8.6],
    [0.4, 8.6],
    [0.5, 7.4],
    [0.8, 7.4],
    [0.88, 6.8],
    [0.9, 6.8],
    [1, 7.2],
  ],
  camX: [
    [0, 0],
    [0.54, 0],
    [0.585, -1.35],
    [0.755, 1.35],
    [0.8, 0],
  ],
  lookY: [
    [0, 0.65],
    [0.16, 0.65],
    [0.27, 1.55],
    [0.4, 1.55],
    [0.5, 0.65],
    [0.9, 0.65],
    [0.97, 0.15],
  ],
  // Dónde flota la porción respecto al pastel: abajo a la izquierda en la
  // cumbre (las etiquetas ocupan la derecha), arriba a la derecha después.
  wedgeOffX: [
    [0.15, 1.95],
    [0.22, -2.05],
    [0.4, -2.05],
    [0.5, 1.95],
  ],
  wedgeOffY: [
    [0.15, 1.05],
    [0.22, 0.25],
    [0.4, 0.25],
    [0.5, 1.05],
  ],
  wedgeOffZ: [
    [0.15, 0.55],
    [0.22, 1.1],
    [0.4, 1.1],
    [0.5, 0.55],
  ],
} satisfies Record<string, Frames>
/** Dónde aterriza la porción al final (su propio plato). */
export const WEDGE_LAND: [number, number, number] = [3.25, 0.07, 0.45]

// ── Sabores ─────────────────────────────────────────────────────────────────

export interface Piece {
  shape: PieceShape
  color: string
  size: number
  count: number
}

export interface Flavor {
  id: string
  name: string
  topping: string
  tint: string
  pieces: Piece[]
}

export const FLAVORS: Flavor[] = [
  {
    id: 'uchuva',
    name: 'Uchuva',
    topping: '#e0902a',
    tint: '#f6ead3',
    pieces: [
      { shape: 'round', color: '#f4a62a', size: 0.085, count: 30 },
      { shape: 'seed', color: '#f7d36b', size: 0.03, count: 30 },
    ],
  },
  {
    id: 'maracuya',
    name: 'Maracuyá y mango',
    topping: '#f0b437',
    tint: '#f5efcd',
    pieces: [
      { shape: 'cube', color: '#f7a92a', size: 0.13, count: 22 },
      { shape: 'seed', color: '#22140b', size: 0.032, count: 70 },
    ],
  },
  {
    id: 'manzana',
    name: 'Manzana',
    topping: '#c08540',
    tint: '#edf0de',
    pieces: [
      { shape: 'slice', color: '#d9a85a', size: 0.17, count: 26 },
      { shape: 'cube', color: '#c98f45', size: 0.08, count: 18 },
    ],
  },
  {
    id: 'frutos-rojos',
    name: 'Frutos rojos',
    topping: '#8a1636',
    tint: '#f4e2e5',
    pieces: [
      { shape: 'raspberry', color: '#c42341', size: 0.1, count: 18 },
      { shape: 'blueberry', color: '#2c2a52', size: 0.065, count: 22 },
      { shape: 'blackberry', color: '#2a0d20', size: 0.085, count: 10 },
    ],
  },
]

/** Sabor con el que abre y cierra la página (y el de la porción). */
export const HOME_FLAVOR = 3

/** Posiciones x de las etiquetas de sabor en el mundo, en el orden del recorrido. */
export const FLAVOR_X = [-2.4, -0.8, 0.8, 2.4]

/**
 * Peso de cada sabor según el progreso. Antes del recorrido manda el sabor de
 * casa; durante el recorrido, la posición del pastel frente a las etiquetas.
 */
export function flavorWeights(p: number, cakeX: number): number[] {
  const w = [0, 0, 0, 0]
  const start = 0.54
  const firstArrive = 0.585
  // Antes y después del recorrido manda el sabor de casa (el último del recorrido)
  if (p <= start || p >= 0.755) {
    w[HOME_FLAVOR] = 1
    return w
  }
  if (p < firstArrive) {
    const t = smooth((p - start) / (firstArrive - start))
    w[HOME_FLAVOR] = 1 - t
    w[0] += t
    return w
  }
  // Índice continuo a lo largo de las etiquetas
  const xs = FLAVOR_X
  let idx = 0
  if (cakeX <= xs[0]) idx = 0
  else if (cakeX >= xs[xs.length - 1]) idx = xs.length - 1
  else {
    for (let i = 0; i < xs.length - 1; i++) {
      if (cakeX <= xs[i + 1]) {
        idx = i + (cakeX - xs[i]) / (xs[i + 1] - xs[i])
        break
      }
    }
  }
  const i0 = Math.floor(idx)
  const f = idx - i0
  // Cambio concentrado cerca del punto medio entre etiquetas
  const t = smooth(clamp01((f - 0.3) / 0.4))
  w[i0] += 1 - t
  if (i0 + 1 < 4) w[i0 + 1] += t
  return w
}

/** Fuerza del tinte de sabor sobre el fondo del mundo. */
export const tintStrength = (p: number) => kf(p, [
  [0.55, 0],
  [0.6, 1],
  [0.75, 1],
  [0.8, 0],
])

export const BASE_BG = '#f3f4ee'
