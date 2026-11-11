/**
 * Piezas del cheesecake con más detalle: capas con bordes redondeados (torno
 * parcial + tapas de corte), fruta modelada y texturas de relieve procedurales.
 */
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

// ── Generador pseudoaleatorio determinista ──────────────────────────────────
export function rng(seed: number) {
  let s = Math.max(1, Math.floor(seed)) % 2147483647
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

// ── Capa: perfil con biseles, girado solo sobre el sector ───────────────────
function arc(cx: number, cy: number, r: number, a0: number, a1: number, steps: number) {
  const out: THREE.Vector2[] = []
  for (let i = 0; i <= steps; i++) {
    const a = a0 + ((a1 - a0) * i) / steps
    out.push(new THREE.Vector2(cx + Math.cos(a) * r, cy + Math.sin(a) * r))
  }
  return out
}

/** Perfil cerrado contra el eje: abajo-centro → borde → arriba-centro. */
function layerProfile(r: number, h: number, bevelTop: number, bevelBottom: number) {
  const pts: THREE.Vector2[] = [new THREE.Vector2(0, 0)]
  if (bevelBottom > 0) pts.push(...arc(r - bevelBottom, bevelBottom, bevelBottom, -Math.PI / 2, 0, 5))
  else pts.push(new THREE.Vector2(r, 0))
  if (bevelTop > 0) pts.push(...arc(r - bevelTop, h - bevelTop, bevelTop, 0, Math.PI / 2, 8))
  else pts.push(new THREE.Vector2(r, h))
  pts.push(new THREE.Vector2(0, h))
  return pts
}

function flipTriangles(g: THREE.BufferGeometry) {
  const pos = g.attributes.position.array as Float32Array
  const nor = g.attributes.normal.array as Float32Array
  const uv = g.attributes.uv?.array as Float32Array | undefined
  const swap = (arr: Float32Array, size: number, tri: number) => {
    const a = (tri * 3 + 1) * size
    const b = (tri * 3 + 2) * size
    for (let k = 0; k < size; k++) {
      const t = arr[a + k]
      arr[a + k] = arr[b + k]
      arr[b + k] = t
    }
  }
  const tris = pos.length / 9
  for (let t = 0; t < tris; t++) {
    swap(pos, 3, t)
    swap(nor, 3, t)
    if (uv) swap(uv, 2, t)
  }
  for (let i = 0; i < nor.length; i++) nor[i] = -nor[i]
}

/**
 * Sector de una capa redondeada. Grupos de material: 0 = exterior, 1 y 2 = caras
 * de corte (para darles un material distinto). y = 0 en la base de la capa.
 */
export function layerSector(r: number, h: number, thetaStart: number, thetaLength: number, bevelTop: number, bevelBottom: number) {
  const profile = layerProfile(r, h, bevelTop, bevelBottom)
  const segs = Math.max(10, Math.round((160 * thetaLength) / (Math.PI * 2)))
  const lathe = new THREE.LatheGeometry(profile, segs, thetaStart, thetaLength).toNonIndexed()
  // UV en unidades del mundo: planas arriba/abajo, cilíndricas en el costado,
  // así la miga y el relieve no se estiran en rayas.
  {
    const pos = lathe.attributes.position
    const nor = lathe.attributes.normal
    const uv = lathe.attributes.uv
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      const z = pos.getZ(i)
      if (Math.abs(nor.getY(i)) > 0.6) uv.setXY(i, x, z)
      else uv.setXY(i, Math.atan2(x, z) * r, y)
    }
  }
  const parts: THREE.BufferGeometry[] = [lathe]
  if (thetaLength < Math.PI * 2 - 1e-3) {
    const shape = new THREE.Shape(profile)
    for (const [phi, flip] of [
      [thetaStart, false],
      [thetaStart + thetaLength, true],
    ] as const) {
      const cap = new THREE.ShapeGeometry(shape, 6).toNonIndexed()
      cap.rotateY(phi - Math.PI / 2)
      if (flip) flipTriangles(cap)
      parts.push(cap)
    }
  }
  return mergeGeometries(parts, true)
}

// ── Fruta ───────────────────────────────────────────────────────────────────
/** Frambuesa o mora: racimo de drupas sobre un elipsoide, hueca abajo. */
function drupeletBerry(radius: number, count: number, elong: number, seed: number) {
  const rand = rng(seed)
  const parts: THREE.BufferGeometry[] = []
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2
    if (y < -0.72) continue // hueco donde iba el tallo
    const rr = Math.sqrt(1 - y * y)
    const th = i * golden
    const d = radius * (0.25 + rand() * 0.06)
    const g = new THREE.SphereGeometry(d, 9, 7)
    g.translate(Math.cos(th) * rr * radius, y * radius * elong, Math.sin(th) * rr * radius)
    parts.push(g)
  }
  const core = new THREE.SphereGeometry(radius * 0.86, 14, 10)
  core.scale(1, elong, 1)
  parts.push(core)
  const merged = mergeGeometries(parts)!
  merged.translate(0, radius * elong * 0.55, 0)
  return merged
}

/** Arándano: esfera achatada con corona en la parte de arriba. */
function blueberry(radius: number) {
  const body = new THREE.SphereGeometry(radius, 22, 16)
  body.scale(1, 0.84, 1)
  const crown = new THREE.TorusGeometry(radius * 0.24, radius * 0.07, 6, 12)
  crown.rotateX(Math.PI / 2)
  crown.translate(0, radius * 0.8, 0)
  const merged = mergeGeometries([body.toNonIndexed(), crown.toNonIndexed()])!
  merged.translate(0, radius * 0.8, 0)
  return merged
}

function roundFruit(radius: number) {
  const g = new THREE.SphereGeometry(radius, 22, 16)
  g.scale(1, 0.93, 1)
  g.translate(0, radius * 0.85, 0)
  return g
}

function softCube(size: number) {
  const g = new RoundedBoxGeometry(size, size * 0.8, size, 3, size * 0.16)
  g.translate(0, size * 0.36, 0)
  return g
}

/** Lámina de manzana: media luna fina. */
function appleSlice(size: number) {
  const g = new THREE.CylinderGeometry(size, size, size * 0.12, 20, 1, false, 0, Math.PI)
  g.rotateZ(0.12)
  g.translate(0, size * 0.1, 0)
  return g
}

function seed(size: number) {
  const g = new THREE.SphereGeometry(size, 8, 6)
  g.scale(1, 0.6, 0.7)
  g.translate(0, size * 0.5, 0)
  return g
}

export type PieceShape = 'raspberry' | 'blackberry' | 'blueberry' | 'round' | 'cube' | 'slice' | 'seed'

export function pieceGeometry(shape: PieceShape, size: number, s = 7) {
  switch (shape) {
    case 'raspberry':
      return drupeletBerry(size, 64, 1.12, s)
    case 'blackberry':
      return drupeletBerry(size, 54, 1.2, s + 3)
    case 'blueberry':
      return blueberry(size)
    case 'round':
      return roundFruit(size)
    case 'cube':
      return softCube(size)
    case 'slice':
      return appleSlice(size)
    case 'seed':
      return seed(size)
  }
}

export function pieceMaterial(shape: PieceShape, color: string) {
  const c = new THREE.Color(color)
  switch (shape) {
    case 'blueberry':
      // Pruina: la capa empolvada del arándano
      return new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.62, sheen: 1, sheenRoughness: 0.6, sheenColor: new THREE.Color('#9aa3c9') })
    case 'raspberry':
      return new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.42, sheen: 0.6, sheenColor: new THREE.Color('#ff9fb0'), clearcoat: 0.25, clearcoatRoughness: 0.4 })
    case 'blackberry':
      return new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.08 })
    case 'seed':
      return new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.25, clearcoat: 0.8 })
    default:
      return new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.3, clearcoat: 0.9, clearcoatRoughness: 0.12 })
  }
}

/** Cuánto se inclina cada tipo al azar (las bayas casi no, los cubos más). */
export const TILT: Record<PieceShape, number> = {
  raspberry: 0.35,
  blackberry: 0.3,
  blueberry: 0.5,
  round: 0.4,
  cube: 1,
  slice: 0.25,
  seed: 1,
}

// ── Texturas procedurales ───────────────────────────────────────────────────
function canvas(size: number, draw: (g: CanvasRenderingContext2D, rand: () => number) => void, seedN: number) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  draw(c.getContext('2d')!, rng(seedN))
  return c
}

export function makeTextures() {
  if (typeof document === 'undefined') return null
  // Miga de frutos secos y avena: color y relieve con las mismas manchas
  const crumbDraw = (gray: boolean) => (g: CanvasRenderingContext2D, rand: () => number) => {
    g.fillStyle = gray ? '#777' : '#b07c45'
    g.fillRect(0, 0, 512, 512)
    for (let i = 0; i < 9000; i++) {
      const v = rand()
      const sz = 1 + rand() * rand() * 9
      if (gray) g.fillStyle = `rgb(${Math.round(60 + v * 170)},${Math.round(60 + v * 170)},${Math.round(60 + v * 170)})`
      else g.fillStyle = v > 0.82 ? '#e2bd85' : v > 0.6 ? '#c99860' : v > 0.3 ? '#8d5c30' : v > 0.12 ? '#6c4321' : '#f0dcb4'
      g.beginPath()
      g.ellipse(rand() * 512, rand() * 512, sz, sz * (0.5 + rand() * 0.6), rand() * Math.PI, 0, Math.PI * 2)
      g.fill()
    }
  }
  const crumb = new THREE.CanvasTexture(canvas(512, crumbDraw(false), 3))
  const crumbBump = new THREE.CanvasTexture(canvas(512, crumbDraw(true), 3))
  crumb.colorSpace = THREE.SRGBColorSpace
  // Relleno cremoso: manchas suaves y burbujitas finas
  const cream = new THREE.CanvasTexture(
    canvas(
      512,
      (g, rand) => {
        g.fillStyle = '#808080'
        g.fillRect(0, 0, 512, 512)
        for (let i = 0; i < 260; i++) {
          const x = rand() * 512
          const y = rand() * 512
          const r = 10 + rand() * 50
          const grad = g.createRadialGradient(x, y, 0, x, y, r)
          const v = rand() > 0.5 ? 150 : 105
          grad.addColorStop(0, `rgba(${v},${v},${v},0.35)`)
          grad.addColorStop(1, 'rgba(128,128,128,0)')
          g.fillStyle = grad
          g.fillRect(x - r, y - r, r * 2, r * 2)
        }
        for (let i = 0; i < 1400; i++) {
          g.fillStyle = 'rgba(70,70,70,0.5)'
          g.beginPath()
          g.arc(rand() * 512, rand() * 512, 0.6 + rand() * 1.4, 0, Math.PI * 2)
          g.fill()
        }
      },
      9,
    ),
  )
  for (const t of [crumb, crumbBump, cream]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.anisotropy = 8
  }
  // Las UV de las capas están en unidades del mundo: 1 textura ≈ 1 unidad
  crumb.repeat.set(1.1, 1.1)
  crumbBump.repeat.set(1.1, 1.1)
  cream.repeat.set(0.8, 0.8)
  return { crumb, crumbBump, cream }
}

// ── Gota de cobertura: lágrima alargada, plana contra el pastel ─────────────
export function dripGeometry(len: number, width: number) {
  const pts: THREE.Vector2[] = []
  const steps = 14
  for (let i = 0; i <= steps; i++) {
    const t = i / steps // 0 = punta de abajo, 1 = arriba
    const y = -len + t * len
    // bulbo abajo, cuello fino, se abre arriba al unirse con la cobertura
    const bulb = Math.sin(Math.min(1, t / 0.28) * Math.PI) * (t < 0.28 ? 1 : 0)
    const neck = 0.55 + 0.45 * t
    const w = width * Math.max(bulb * 1.15, neck * (t > 0.14 ? 1 : t / 0.14))
    pts.push(new THREE.Vector2(Math.max(0.0001, w), y))
  }
  pts.unshift(new THREE.Vector2(0, -len - width * 0.25))
  const g = new THREE.LatheGeometry(pts, 14)
  g.scale(1, 1, 0.55)
  return g
}
