'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Canvas, createRoot, extend, useFrame, useThree } from '@react-three/fiber'
import { Environment, Html, Lightformer, PerformanceMonitor } from '@react-three/drei'
import { EffectComposer, N8AO, SMAA, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'
import { TILT, dripGeometry, layerSector, makeTextures, pieceGeometry, pieceMaterial, rng } from './cake-parts'
import {
  FLAVORS,
  FLAVOR_X,
  HOME_FLAVOR,
  T,
  WEDGE_LAND,
  clamp01,
  flavorWeights,
  kf,
  lerp,
} from './track'

export interface SceneState {
  /** Progreso suavizado del recorrido (0 a 1). */
  p: number
  reduced: boolean
  /** Desplazamiento de la luz principal (solo en el render por pasadas) */
  jitter?: [number, number]
}

// ── Medidas (unidades del mundo) ─────────────────────────────────────────────
const R = 1.2
const BASE_H = 0.3
const FILL_H = 0.8
const TOP_H = 0.1
const WEDGE = 0.78 // ángulo de la porción (~1/8)
const GLAZE_Y = BASE_H + FILL_H - 0.03
const TOP_Y = GLAZE_Y + TOP_H

/** Posiciones repartidas sobre un sector de la cara superior. */
function scatter(count: number, thetaStart: number, thetaLength: number, seed: number, rMax = R * 0.86) {
  const rand = rng(seed)
  const pts: { x: number; z: number; rot: number; jitter: number; delay: number }[] = []
  for (let i = 0; i < count; i++) {
    const theta = thetaStart + 0.07 + rand() * (thetaLength - 0.14)
    const r = Math.sqrt(rand()) * rMax
    pts.push({ x: Math.sin(theta) * r, z: Math.cos(theta) * r, rot: rand() * Math.PI * 2, jitter: 0.8 + rand() * 0.4, delay: rand() })
  }
  return pts
}

// ── Materiales compartidos ──────────────────────────────────────────────────
type Mats = ReturnType<typeof buildMaterials>
function buildMaterials() {
  const tex = makeTextures()
  const base = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    map: tex?.crumb,
    bumpMap: tex?.crumbBump,
    bumpScale: 2.2,
    roughness: 0.92,
  })
  const fill = new THREE.MeshPhysicalMaterial({
    color: '#f5eddc',
    roughness: 0.5,
    bumpMap: tex?.cream,
    bumpScale: 0.35,
    sheen: 0.5,
    sheenRoughness: 0.5,
    sheenColor: new THREE.Color('#fff6e4'),
  })
  const fillCut = new THREE.MeshPhysicalMaterial({
    color: '#f8f1e3',
    roughness: 0.72,
    bumpMap: tex?.cream,
    bumpScale: 0.9,
  })
  const plate = new THREE.MeshPhysicalMaterial({ color: '#fbfaf6', roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08 })
  const nutLight = new THREE.MeshStandardMaterial({ color: '#d9b27a', roughness: 0.7 })
  const nutDark = new THREE.MeshStandardMaterial({ color: '#7a4a24', roughness: 0.6 })
  return { base, fill, fillCut, plate, nutLight, nutDark }
}
let sharedMats: Mats | null = null
function useMaterials(): Mats {
  return useMemo(() => (sharedMats ??= buildMaterials()), [])
}

function glazeMaterial(color: string) {
  return new THREE.MeshPhysicalMaterial({ color, roughness: 0.14, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.3 })
}

// ── Fruta instanciada (una malla por tipo de pieza) ──────────────────────────
function FruitPieces({
  flavorIndex,
  thetaStart,
  thetaLength,
  weightRef,
  offRef,
  seed,
}: {
  flavorIndex: number
  thetaStart: number
  thetaLength: number
  weightRef: React.MutableRefObject<number[]>
  offRef?: React.MutableRefObject<(delay: number) => number>
  seed: number
}) {
  const flavor = FLAVORS[flavorIndex]
  const sectorShare = thetaLength / (Math.PI * 2)
  const groups = useMemo(
    () =>
      flavor.pieces.map((piece, i) => ({
        piece,
        pts: scatter(Math.max(2, Math.round(piece.count * sectorShare)), thetaStart, thetaLength, seed + i * 97 + flavorIndex * 13),
        geo: pieceGeometry(piece.shape, piece.size, seed + i),
        mat: pieceMaterial(piece.shape, piece.color),
        tilt: TILT[piece.shape],
      })),
    [flavor, flavorIndex, sectorShare, thetaStart, thetaLength, seed],
  )
  const refs = useRef<(THREE.InstancedMesh | null)[]>([])
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame(() => {
    const w = weightRef.current[flavorIndex]
    groups.forEach((g, gi) => {
      const mesh = refs.current[gi]
      if (!mesh) return
      mesh.visible = w > 0.01
      if (!mesh.visible) return
      g.pts.forEach((pt, i) => {
        const lift = offRef ? offRef.current(pt.delay) : 0
        const s = w * pt.jitter
        dummy.position.set(pt.x, TOP_Y - 0.012 + lift, pt.z)
        dummy.rotation.set(Math.sin(pt.rot * 3) * 0.6 * g.tilt, pt.rot, Math.cos(pt.rot * 2) * 0.6 * g.tilt)
        dummy.scale.setScalar(Math.max(0.0001, s))
        dummy.updateMatrix()
        mesh.setMatrixAt(i, dummy.matrix)
      })
      mesh.instanceMatrix.needsUpdate = true
    })
  })

  return (
    <>
      {groups.map((g, gi) => (
        <instancedMesh
          key={gi}
          ref={(m) => {
            refs.current[gi] = m
          }}
          args={[g.geo, g.mat, g.pts.length]}
          castShadow
          receiveShadow
        />
      ))}
    </>
  )
}

// ── Gotas de cobertura en el borde ──────────────────────────────────────────
function Drips({ thetaStart, thetaLength, material, seed }: { thetaStart: number; thetaLength: number; material: THREE.Material; seed: number }) {
  const drips = useMemo(() => {
    const rand = rng(seed)
    const n = Math.max(1, Math.round(18 * (thetaLength / (Math.PI * 2))))
    return Array.from({ length: n }, (_, i) => {
      const theta = thetaStart + ((i + 0.3 + rand() * 0.4) / n) * thetaLength
      const len = rand() < 0.3 ? 0.05 + rand() * 0.06 : 0.12 + rand() * 0.3
      return { theta, geo: dripGeometry(len, 0.03 + rand() * 0.018) }
    })
  }, [thetaStart, thetaLength, seed])
  return (
    <>
      {drips.map((d, i) => (
        <mesh
          key={i}
          geometry={d.geo}
          material={material}
          position={[Math.sin(d.theta) * (R - 0.012), GLAZE_Y + 0.02, Math.cos(d.theta) * (R - 0.012)]}
          rotation={[0, d.theta, 0]}
          castShadow
        />
      ))}
    </>
  )
}

// ── Trozos de frutos secos asomando en la base ──────────────────────────────
function Nuts({ thetaStart, thetaLength, seed }: { thetaStart: number; thetaLength: number; seed: number }) {
  const mats = useMaterials()
  const sets = useMemo(() => {
    const rand = rng(seed)
    const n = Math.round(90 * (thetaLength / (Math.PI * 2)))
    const make = () =>
      Array.from({ length: n }, () => {
        const th = thetaStart + 0.03 + rand() * (thetaLength - 0.06)
        const m = new THREE.Matrix4()
        const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rand() * 6, rand() * 6, rand() * 6))
        const sc = 0.6 + rand() * 0.8
        m.compose(
          new THREE.Vector3(Math.sin(th) * (R - 0.006), 0.05 + rand() * (BASE_H - 0.1), Math.cos(th) * (R - 0.006)),
          q,
          new THREE.Vector3(sc, sc * 0.7, sc),
        )
        return m
      })
    return [make(), make()]
  }, [thetaStart, thetaLength, seed])
  const geo = useMemo(() => new THREE.DodecahedronGeometry(0.03, 0), [])
  const refs = useRef<(THREE.InstancedMesh | null)[]>([])
  useLayoutEffect(() => {
    sets.forEach((list, k) => {
      const mesh = refs.current[k]
      if (!mesh) return
      list.forEach((m, i) => mesh.setMatrixAt(i, m))
      mesh.instanceMatrix.needsUpdate = true
    })
  }, [sets])
  return (
    <>
      {sets.map((list, k) => (
        <instancedMesh
          key={k}
          ref={(m) => {
            refs.current[k] = m
          }}
          args={[geo, k === 0 ? mats.nutLight : mats.nutDark, list.length]}
          castShadow
        />
      ))}
    </>
  )
}

/** Las tres capas de un sector (base, relleno, cobertura). */
function useLayerGeos(thetaStart: number, thetaLength: number) {
  return useMemo(
    () => ({
      base: layerSector(R, BASE_H, thetaStart, thetaLength, 0.025, 0.02),
      fill: layerSector(R - 0.012, FILL_H, thetaStart, thetaLength, 0.05, 0.012),
      top: layerSector(R + 0.01, TOP_H, thetaStart, thetaLength, 0.05, 0.004),
    }),
    [thetaStart, thetaLength],
  )
}

// ── El cheesecake (cuerpo con porción faltante) ──────────────────────────────
function Cheesecake({ state, weightRef }: { state: React.MutableRefObject<SceneState>; weightRef: React.MutableRefObject<number[]> }) {
  const mats = useMaterials()
  const thetaStart = WEDGE / 2
  const thetaLength = Math.PI * 2 - WEDGE
  const geos = useLayerGeos(thetaStart, thetaLength)
  const topMat = useMemo(() => glazeMaterial(FLAVORS[HOME_FLAVOR].topping), [])
  const colors = useMemo(() => FLAVORS.map((f) => new THREE.Color(f.topping)), [])
  const fillRef = useRef<THREE.Group>(null)
  const topRef = useRef<THREE.Group>(null)
  const fruitRef = useRef<THREE.Group>(null)
  const fruitOff = useRef<(delay: number) => number>(() => 0)

  useFrame(() => {
    const { p } = state.current
    const twist = kf(p, T.layerTwist)
    if (fillRef.current) {
      fillRef.current.position.y = kf(p, T.fillOff)
      fillRef.current.rotation.y = -0.18 * twist
    }
    if (topRef.current) {
      topRef.current.position.y = kf(p, T.topOff)
      topRef.current.rotation.y = 0.22 * twist
    }
    if (fruitRef.current) fruitRef.current.rotation.y = 0.38 * twist
    // La fruta llueve con un pequeño desfase por pieza
    fruitOff.current = (delay: number) => kf(p - delay * 0.025, T.fruitOff)
    // Color de la cobertura según los pesos de sabor
    const w = weightRef.current
    const c = topMat.color.setRGB(0, 0, 0)
    colors.forEach((col, i) => {
      c.r += col.r * w[i]
      c.g += col.g * w[i]
      c.b += col.b * w[i]
    })
  })

  return (
    <group>
      <mesh geometry={geos.base} material={mats.base} castShadow receiveShadow />
      <Nuts thetaStart={thetaStart} thetaLength={thetaLength} seed={41} />
      <group ref={fillRef}>
        <mesh geometry={geos.fill} material={[mats.fill, mats.fillCut, mats.fillCut]} position={[0, BASE_H - 0.006, 0]} castShadow receiveShadow />
      </group>
      <group ref={topRef}>
        <mesh geometry={geos.top} material={topMat} position={[0, GLAZE_Y, 0]} castShadow receiveShadow />
        <Drips thetaStart={thetaStart} thetaLength={thetaLength} material={topMat} seed={77} />
      </group>
      <group ref={fruitRef}>
        {FLAVORS.map((_, i) => (
          <FruitPieces key={i} flavorIndex={i} thetaStart={thetaStart} thetaLength={thetaLength} weightRef={weightRef} offRef={fruitOff} seed={11 + i} />
        ))}
      </group>
      <LayerLabels state={state} />
    </group>
  )
}

// ── Etiquetas de capas (solo en la cumbre) ──────────────────────────────────
const LAYER_LABELS = [
  { key: 'fruta', title: 'Fruta fresca', text: 'Encima de todo, sin almíbar.', y: TOP_Y + 0.12, track: T.fruitOff },
  { key: 'cobertura', title: 'Endulzado con stevia', text: 'El dulzor viene de la fruta, no del azúcar.', y: GLAZE_Y + TOP_H / 2, track: T.topOff },
  { key: 'relleno', title: 'Queso con yogur griego', text: 'Cremoso y liviano.', y: BASE_H + FILL_H / 2, track: T.fillOff },
  { key: 'base', title: 'Frutos secos y avena', text: 'En lugar de galleta.', y: BASE_H / 2, track: null },
] as const

function LayerLabels({ state }: { state: React.MutableRefObject<SceneState> }) {
  const refs = useRef<(HTMLDivElement | null)[]>([])
  const groups = useRef<(THREE.Group | null)[]>([])
  useFrame(() => {
    const { p } = state.current
    const show = clamp01((kf(p, T.layerTwist) - 0.75) / 0.25) * (p < 0.405 ? 1 : 0)
    LAYER_LABELS.forEach((l, i) => {
      const g = groups.current[i]
      if (g) g.position.y = l.y + (l.track ? kf(p, l.track) : 0)
      const el = refs.current[i]
      if (el) {
        const stagger = clamp01(show * 1.6 - i * 0.18)
        el.style.opacity = String(stagger)
        el.style.transform = `translateX(${(1 - stagger) * 12}px)`
      }
    })
  })
  return (
    <>
      {LAYER_LABELS.map((l, i) => (
        <group
          key={l.key}
          ref={(g) => {
            groups.current[i] = g
          }}
          name={`label-${l.key}`}
          position={[R + 0.12, l.y, 0.2]}
        >
          <Html zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
            <div
              className="sx-layer"
              ref={(el) => {
                refs.current[i] = el
              }}
            >
              <span className="sx-layer-line" aria-hidden />
              <strong>{l.title}</strong>
              <span>{l.text}</span>
            </div>
          </Html>
        </group>
      ))}
    </>
  )
}

// ── La porción (la movida propia del sitio) ─────────────────────────────────
function Wedge() {
  const mats = useMaterials()
  const thetaStart = -WEDGE / 2
  const geos = useLayerGeos(thetaStart, WEDGE)
  const topMat = useMemo(() => glazeMaterial(FLAVORS[HOME_FLAVOR].topping), [])
  const homeWeights = useRef(FLAVORS.map((_, i) => (i === HOME_FLAVOR ? 1 : 0)))
  return (
    <group>
      <mesh geometry={geos.base} material={mats.base} castShadow receiveShadow />
      <Nuts thetaStart={thetaStart} thetaLength={WEDGE} seed={42} />
      <mesh geometry={geos.fill} material={[mats.fill, mats.fillCut, mats.fillCut]} position={[0, BASE_H - 0.006, 0]} castShadow receiveShadow />
      <mesh geometry={geos.top} material={topMat} position={[0, GLAZE_Y, 0]} castShadow receiveShadow />
      <Drips thetaStart={thetaStart} thetaLength={WEDGE} material={topMat} seed={78} />
      <FruitPieces flavorIndex={HOME_FLAVOR} thetaStart={thetaStart} thetaLength={WEDGE} weightRef={homeWeights} seed={501} />
    </group>
  )
}

function Plate({ radius, material }: { radius: number; material: THREE.Material }) {
  const geo = useMemo(() => {
    const pts = [
      new THREE.Vector2(0, 0.01),
      new THREE.Vector2(radius * 0.82, 0.01),
      new THREE.Vector2(radius * 0.96, 0.05),
      new THREE.Vector2(radius, 0.075),
      new THREE.Vector2(radius * 0.985, 0.085),
      new THREE.Vector2(radius * 0.8, 0.045),
      new THREE.Vector2(0, 0.045),
    ]
    return new THREE.LatheGeometry(pts, 96)
  }, [radius])
  return <mesh geometry={geo} material={material} position={[0, -0.045, 0]} receiveShadow castShadow />
}

// ── Escena y coreografía ────────────────────────────────────────────────────
function World({ state, onCta, lowPower, hq = false }: { state: React.MutableRefObject<SceneState>; onCta: () => void; lowPower: boolean; hq?: boolean }) {
  const mats = useMaterials()
  const { camera, size } = useThree()
  const mobile = size.width / size.height < 0.8
  const cake = useRef<THREE.Group>(null)
  const wedge = useRef<THREE.Group>(null)
  const plate2 = useRef<THREE.Group>(null)
  const cta = useRef<HTMLDivElement>(null)
  const flavorLabels = useRef<(HTMLDivElement | null)[]>([])
  const weightRef = useRef<number[]>(FLAVORS.map((_, i) => (i === HOME_FLAVOR ? 1 : 0)))
  const look = useMemo(() => new THREE.Vector3(), [])
  const keyLight = useRef<THREE.DirectionalLight>(null)

  useLayoutEffect(() => {
    camera.near = 0.1
    camera.far = 60
    camera.updateProjectionMatrix()
  }, [camera])

  useFrame(({ clock }) => {
    const { p, reduced, jitter } = state.current
    if (keyLight.current) keyLight.current.position.set(-4.5 + (jitter?.[0] ?? 0), 6.5, 4.5 + (jitter?.[1] ?? 0))
    const t = clock.getElapsedTime()
    const travel = p > 0.54 && p < 0.8
    const xScale = mobile ? (travel ? 0.62 : 0) : 1
    const cx =
      kf(p, T.cakeX) * xScale +
      (mobile && p > 0.14 && p < 0.42 ? -0.55 : 0) +
      (mobile ? kf(p, [
        [0.9, 0],
        [0.97, -0.95],
      ]) : 0)
    const cy = kf(p, T.cakeY)
    const sc = kf(p, T.cakeScale)
    const ry = kf(p, T.rotY) + (reduced ? 0 : Math.sin(t * 0.6) * 0.04 * (p < 0.12 ? 1 : 0))
    if (cake.current) {
      cake.current.position.set(cx, cy, 0)
      cake.current.rotation.set(kf(p, T.rotX), ry, 0)
      cake.current.scale.setScalar(sc)
    }
    weightRef.current = flavorWeights(p, kf(p, T.cakeX))

    // Porción: anclada al hueco al inicio, libre después, servida al final
    if (wedge.current) {
      const free = kf(p, T.wedgeFree)
      const pull = kf(p, T.wedgePull) * sc
      const anchored = new THREE.Vector3(cx + Math.sin(ry) * pull, cy, Math.cos(ry) * pull)
      const bob = reduced ? 0 : Math.sin(t * 1.1) * 0.06
      const freePos = new THREE.Vector3(
        cx + kf(p, T.wedgeOffX) * (mobile ? 0.55 : 1),
        cy + kf(p, T.wedgeOffY) + bob,
        kf(p, T.wedgeOffZ),
      )
      const land = kf(p, T.wedgeLand)
      const landPos = new THREE.Vector3(mobile ? 1.35 : WEDGE_LAND[0], WEDGE_LAND[1], WEDGE_LAND[2] + (mobile ? 0.9 : 0))
      const pos = anchored.lerp(freePos, free).lerp(landPos, land)
      wedge.current.position.copy(pos)
      const freeRot = (reduced ? 0 : t * 0.35) + p * 3
      wedge.current.rotation.set(
        lerp(0, -0.25, free) * (1 - land),
        lerp(lerp(ry, freeRot, free), -1.05, land),
        lerp(0, 0.18, free) * (1 - land),
      )
      wedge.current.scale.setScalar(lerp(sc, 0.85, free) * lerp(1, 1.15, land))
    }
    if (plate2.current) {
      const s = kf(p, T.plate2)
      plate2.current.scale.setScalar(Math.max(0.0001, s))
      plate2.current.position.set(mobile ? 1.35 : WEDGE_LAND[0], 0, WEDGE_LAND[2] + (mobile ? 0.9 : 0))
    }
    if (cta.current) {
      const o = clamp01((p - 0.95) / 0.03)
      cta.current.style.opacity = String(o)
      cta.current.style.pointerEvents = o > 0.5 ? 'auto' : 'none'
    }
    // Etiquetas de sabor en el mundo: visibles solo durante el recorrido
    const labelO = kf(p, [
      [0.55, 0],
      [0.59, 1],
      [0.75, 1],
      [0.79, 0],
    ])
    flavorLabels.current.forEach((el, i) => {
      if (!el) return
      el.style.opacity = String(labelO * (mobile ? weightRef.current[i] : 0.45 + 0.55 * weightRef.current[i]))
    })

    // Cámara
    const camZ = kf(p, T.camZ) * (mobile ? 2.35 : 1.38)
    const camX = kf(p, T.camX) * (mobile ? 0.62 : 1)
    const lookY = kf(p, T.lookY) + (mobile ? 1.9 : 0.15)
    camera.position.set(camX, lookY + camZ * 0.2, camZ)
    look.set(camX, lookY, 0)
    camera.lookAt(look)
  })

  return (
    <>
      <hemisphereLight args={['#ffffff', '#e7e3d6', 0.7]} />
      <directionalLight
        ref={keyLight}
        position={[-4.5, 6.5, 4.5]}
        intensity={2.4}
        color="#fff4e2"
        castShadow
        shadow-mapSize={hq ? [4096, 4096] : [2048, 2048]}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-4}
        shadow-radius={6}
        shadow-bias={-0.0004}
      />
      <directionalLight position={[5, 3, -3]} intensity={0.9} color="#fff1dc" />
      <Environment resolution={256} frames={1}>
        {/* Ventana grande a la izquierda (luz de mañana) y rebotes suaves */}
        <Lightformer form="rect" intensity={3} position={[-5, 4, 3]} rotation-y={Math.PI / 3} scale={[5, 7, 1]} />
        <Lightformer form="rect" intensity={1.4} color="#fff3e0" position={[4, 2.5, 4]} rotation-y={-Math.PI / 4} scale={[4, 3, 1]} />
        <Lightformer form="rect" intensity={1.2} position={[0, 7, 0]} rotation-x={Math.PI / 2} scale={[8, 8, 1]} />
        <Lightformer form="ring" intensity={2} position={[2, 3, -5]} scale={2} />
      </Environment>

      <group ref={cake}>
        <Plate radius={1.75} material={mats.plate} />
        <Cheesecake state={state} weightRef={weightRef} />
      </group>
      <group ref={wedge}>
        <Wedge />
      </group>
      <group ref={plate2}>
        <Plate radius={1.05} material={mats.plate} />
        <Html position={[mobile ? -1.35 : 0, mobile ? -0.85 : -0.7, 0.9]} center zIndexRange={[30, 0]}>
          <div ref={cta} className="sx-cta" style={{ opacity: 0 }}>
            <p className="sx-cta-title">Tu porción, servida</p>
            <p className="sx-cta-price">Frutos rojos, $14.000</p>
            <button type="button" className="sx-btn sx-btn-primary" onClick={onCta}>
              Pedir mi porción
            </button>
          </div>
        </Html>
      </group>

      {FLAVORS.map((f, i) => (
        <Html key={f.id} position={[FLAVOR_X[i] * (mobile ? 0.62 : 1), -0.2, 1.6]} center zIndexRange={[15, 0]} style={{ pointerEvents: 'none' }}>
          <div
            className="sx-flavor"
            ref={(el) => {
              flavorLabels.current[i] = el
            }}
            style={{ opacity: 0 }}
          >
            {f.name}
          </div>
        </Html>
      ))}

      {/* Suelo invisible que solo recibe la sombra de la luz principal */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.046, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <shadowMaterial transparent opacity={0.2} color="#4a3a33" />
      </mesh>
      {!lowPower && <Effects mobile={mobile} hq={hq} />}
    </>
  )
}

/** Oclusión ambiental (sombras de contacto entre fruta, cobertura y capas). */
function Effects({ mobile, hq = false }: { mobile: boolean; hq?: boolean }) {
  return (
    <EffectComposer multisampling={0}>
      <N8AO aoRadius={0.35} distanceFalloff={0.6} intensity={mobile ? 2 : 2.6} halfRes={mobile} quality={hq ? 'ultra' : mobile ? 'low' : 'medium'} color="#3a2a26" />
      <SMAA />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  )
}

export default function CheesecakeScene({ state, onCta }: { state: React.MutableRefObject<SceneState>; onCta: () => void }) {
  // Si el equipo no sostiene la animación, baja la resolución y apaga la oclusión
  const [dpr, setDpr] = useState(1.75)
  const [lowPower, setLowPower] = useState(false)
  const degrade = () => {
    setDpr(1)
    setLowPower(true)
  }
  return (
    <Canvas
      shadows
      dpr={dpr}
      gl={{ antialias: true, alpha: true }}
      camera={{ fov: 32, position: [0, 2.2, 7.4] }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.05
      }}
      aria-hidden
    >
      <PerformanceMonitor onIncline={() => setDpr(2)} onDecline={degrade} flipflops={3} onFallback={degrade}>
        <World state={state} onCta={onCta} lowPower={lowPower} />
      </PerformanceMonitor>
    </Canvas>
  )
}

// ── Modo render: dibuja fotogramas a pedido para la secuencia de imágenes ────
export interface FrameResult {
  /** Posición en pantalla (0 a 1) de cada etiqueta de capa */
  labels: Record<string, [number, number]>
}

function Capture({ state }: { state: React.MutableRefObject<SceneState> }) {
  const { scene, camera } = useThree()
  const step = useThree((st) => st.advance)
  useLayoutEffect(() => {
    const v = new THREE.Vector3()
    const w = window as unknown as { __zendaRender?: (p: number, jitter?: [number, number]) => FrameResult }
    w.__zendaRender = (p: number, jitter?: [number, number]) => {
      state.current.p = p
      state.current.jitter = jitter
      // Dos pasadas: la primera actualiza matrices y sombras, la segunda dibuja estable
      step(performance.now(), true)
      step(performance.now(), true)
      const labels: FrameResult['labels'] = {}
      scene.traverse((o) => {
        if (o.name.startsWith('label-')) {
          v.setFromMatrixPosition(o.matrixWorld).project(camera)
          labels[o.name.slice(6)] = [+((v.x + 1) / 2).toFixed(4), +((1 - v.y) / 2).toFixed(4)]
        }
      })
      return { labels }
    }
    return () => {
      delete w.__zendaRender
    }
  }, [scene, camera, state, step])
  return null
}

/**
 * Lienzo de tamaño fijo para renderizar fotogramas (sin animación propia). Usa
 * createRoot con tamaño explícito para no depender de ResizeObserver, que el
 * navegador congela en pestañas ocultas.
 */
export function CheesecakeRenderer({ state, width, height }: { state: React.MutableRefObject<SceneState>; width: number; height: number }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const host = ref.current
    if (!host) return
    // Lienzo nuevo en cada montaje: al desmontar, R3F destruye el contexto WebGL
    const canvas = document.createElement('canvas')
    canvas.style.display = 'block'
    host.appendChild(canvas)
    extend(THREE as unknown as Parameters<typeof extend>[0])
    const root = createRoot(canvas)
    let alive = true
    void (async () => {
      await root.configure({
        size: { width, height, top: 0, left: 0 },
        dpr: 1,
        frameloop: 'never',
        shadows: true,
        gl: { antialias: true, alpha: true, preserveDrawingBuffer: true },
        camera: { fov: 32, position: [0, 2.2, 7.4] },
        onCreated: ({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.05
        },
      })
      if (!alive) return
      root.render(
        <>
          <World state={state} onCta={() => {}} lowPower={false} hq />
          <Capture state={state} />
        </>,
      )
    })()
    return () => {
      alive = false
      root.unmount()
      canvas.remove()
    }
  }, [state, width, height])
  return <div ref={ref} style={{ width, height }} />
}
