import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { type Group, type Mesh } from 'three'
import type { EmblemKind } from '../../content/services'
import { damp, easeInOutCubic } from '../../lib/math'
import { gear, rbox } from '../geometry'
import type { MaterialSet } from '../materials'
import { rig } from '../rig'

export interface EmblemProps {
  m: MaterialSet
  /** Presencia del emblema (0 oculto → 1 visible). La escribe el anfitrión. */
  state: { vis: number }
}

/* 01 · Sitios web — una ventana de navegador descompuesta en capas. */
function WebEmblem({ m, state }: EmblemProps) {
  const layers = useRef<(Mesh | null)[]>([])
  const depths = [0.3, 0.52, 0.22, 0.22, 0.44]

  useFrame((s) => {
    if (state.vis < 0.01) return
    const t = s.clock.elapsedTime * rig.motion
    layers.current.forEach((layer, i) => {
      if (layer) layer.position.z = depths[i] * (0.35 + 0.65 * state.vis) + Math.sin(t * 0.9 + i * 1.3) * 0.045
    })
  })

  const set = (i: number) => (mesh: Mesh | null) => {
    layers.current[i] = mesh
  }

  return (
    <group rotation={[0.1, -0.5, 0]}>
      <mesh geometry={rbox(2.3, 1.55, 0.08, 0.04)} material={m.obsidian} />
      <mesh geometry={rbox(2.3, 0.2, 0.1, 0.04)} position={[0, 0.675, 0.012]} material={m.titanium} />
      {[m.core, m.bone, m.obsidian].map((mat, i) => (
        <mesh key={i} position={[-1.0 + i * 0.13, 0.675, 0.07]} material={mat}>
          <sphereGeometry args={[0.04, 16, 12]} />
        </mesh>
      ))}
      <mesh ref={set(0)} geometry={rbox(1.15, 0.62, 0.06)} position={[-0.38, 0.08, 0.3]} material={m.bone} />
      <mesh ref={set(1)} geometry={rbox(0.62, 0.95, 0.05)} position={[0.64, -0.08, 0.52]} material={m.glass} />
      <mesh ref={set(2)} geometry={rbox(1.15, 0.08, 0.05, 0.02)} position={[-0.38, -0.4, 0.22]} material={m.titanium} />
      <mesh ref={set(3)} geometry={rbox(0.7, 0.08, 0.05, 0.02)} position={[-0.605, -0.56, 0.22]} material={m.titanium} />
      <mesh ref={set(4)} geometry={rbox(0.34, 0.13, 0.06, 0.03)} position={[-0.76, -0.1, 0.44]} material={m.spark} />
    </group>
  )
}

/* 02 · Tiendas en línea — una bolsa de compra con su etiqueta en órbita. */
function CommerceEmblem({ m, state }: EmblemProps) {
  const orbit = useRef<Group>(null!)
  const parcel = useRef<Mesh>(null!)

  useFrame((s) => {
    if (state.vis < 0.01) return
    const t = s.clock.elapsedTime * rig.motion
    orbit.current.rotation.y = t * 0.8
    parcel.current.position.y = -0.62 + Math.sin(t * 1.1) * 0.05
    parcel.current.rotation.y = t * 0.3
  })

  return (
    <group rotation={[0.16, -0.5, 0]}>
      <mesh geometry={rbox(1.3, 1.45, 0.72, 0.07)} position={[0, -0.12, 0]} material={m.bone} />
      <mesh geometry={rbox(0.52, 0.16, 0.04, 0.02)} position={[0, -0.25, 0.37]} material={m.obsidian} />
      <mesh position={[0, 0.6, 0.22]} material={m.titanium}>
        <torusGeometry args={[0.34, 0.04, 12, 40, Math.PI]} />
      </mesh>
      <mesh position={[0, 0.6, -0.22]} material={m.titanium}>
        <torusGeometry args={[0.34, 0.04, 12, 40, Math.PI]} />
      </mesh>
      <group ref={orbit} rotation={[0, 0, 0.3]}>
        <mesh position={[1.3, 0.15, 0]} rotation={[Math.PI / 2, 0, 0]} material={m.spark}>
          <cylinderGeometry args={[0.24, 0.24, 0.07, 40]} />
        </mesh>
      </group>
      <mesh ref={parcel} geometry={rbox(0.5, 0.42, 0.5, 0.04)} position={[-1.0, -0.62, 0.5]} material={m.titanium} />
    </group>
  )
}

/* 03 · Plataformas — interfaz, lógica y datos: tres capas apiladas. */
function PlatformEmblem({ m, state }: EmblemProps) {
  const layers = useRef<(Group | null)[]>([])

  useFrame((s) => {
    if (state.vis < 0.01) return
    const t = s.clock.elapsedTime * rig.motion
    const gap = 0.3 + 0.3 * state.vis + Math.sin(t * 0.8) * 0.06
    layers.current.forEach((layer, i) => {
      if (layer) layer.position.y = (i - 1) * gap
    })
  })

  const set = (i: number) => (g: Group | null) => {
    layers.current[i] = g
  }

  return (
    <group rotation={[0.52, 0.78, 0]}>
      <group ref={set(0)}>
        <mesh geometry={rbox(1.9, 0.2, 1.9, 0.06)} material={m.obsidian} />
      </group>
      <group ref={set(1)}>
        <mesh geometry={rbox(1.9, 0.2, 1.9, 0.06)} material={m.titanium} />
      </group>
      <group ref={set(2)}>
        <mesh geometry={rbox(1.9, 0.16, 1.9, 0.06)} material={m.glass} />
        <mesh geometry={rbox(0.8, 0.1, 0.5, 0.03)} position={[-0.35, 0.14, 0.45]} material={m.bone} />
        <mesh geometry={rbox(0.34, 0.14, 0.34, 0.03)} position={[0.55, 0.16, -0.5]} material={m.spark} />
        <mesh geometry={rbox(0.8, 0.07, 0.12, 0.02)} position={[-0.35, 0.12, -0.1]} material={m.titanium} />
      </group>
    </group>
  )
}

/* 04 · Automatización — engranajes sincronizados que trabajan solos. */
function AutomationEmblem({ m, state }: EmblemProps) {
  const gears = useRef<(Mesh | null)[]>([])

  const layout = useMemo(() => {
    const n1 = 12
    const n2 = 8
    const n3 = 6
    const c1: [number, number] = [-0.42, -0.12]
    const c2: [number, number] = [0.74, -0.42]
    const c3: [number, number] = [-0.1, 0.87]
    const theta12 = Math.atan2(c2[1] - c1[1], c2[0] - c1[0])
    const theta13 = Math.atan2(c3[1] - c1[1], c3[0] - c1[0])
    return {
      n1, n2, n3, c1, c2, c3,
      // Fases para que los dientes engranen exactamente.
      a1: theta12,
      a2: theta12 + Math.PI - Math.PI / n2,
      a3: theta13 + Math.PI - Math.PI / n3 + ((theta13 - theta12) * n1) / n3,
    }
  }, [])

  useFrame((s) => {
    if (state.vis < 0.01) return
    const w = s.clock.elapsedTime * rig.motion * 0.45
    const [g1, g2, g3] = gears.current
    if (g1) g1.rotation.z = layout.a1 + w
    if (g2) g2.rotation.z = layout.a2 - (w * layout.n1) / layout.n2
    if (g3) g3.rotation.z = layout.a3 - (w * layout.n1) / layout.n3
  })

  const set = (i: number) => (mesh: Mesh | null) => {
    gears.current[i] = mesh
  }

  return (
    <group rotation={[0.18, 0.36, 0]} position={[0, -0.1, 0]}>
      <mesh ref={set(0)} geometry={gear(12, 0.8, 0.63, 0.2, 0.24)} position={[...layout.c1, 0]} material={m.titanium} />
      <mesh ref={set(1)} geometry={gear(8, 0.55, 0.4, 0.14, 0.24)} position={[...layout.c2, 0]} material={m.obsidian} />
      <mesh ref={set(2)} geometry={gear(6, 0.42, 0.28, 0.1, 0.24)} position={[...layout.c3, 0]} material={m.core} />
      {[layout.c1, layout.c2, layout.c3].map((c, i) => (
        <mesh
          key={i}
          position={[c[0], c[1], 0]}
          rotation={[Math.PI / 2, 0, 0]}
          material={i === 2 ? m.spark : m.bone}
        >
          <cylinderGeometry args={[[0.16, 0.11, 0.08][i], [0.16, 0.11, 0.08][i], 0.36, 28]} />
        </mesh>
      ))}
    </group>
  )
}

/* 05 · Soluciones a medida — la pieza que faltaba, cortada con exactitud. */
function CustomEmblem({ m, state }: EmblemProps) {
  const piece = useRef<Mesh>(null!)
  const slot = useRef<Mesh>(null!)

  useFrame((s) => {
    if (state.vis < 0.01) return
    const t = s.clock.elapsedTime * rig.motion
    // Ciclo: la pieza se retira, gira y vuelve a encajar.
    const cycle = rig.motion > 0 ? easeInOutCubic(0.5 + 0.5 * Math.sin(t * 0.9)) : 0.35
    const k = cycle * 0.62
    piece.current.position.set(0.41 + k, 0.41 + k, 0.41 + k)
    piece.current.rotation.y = cycle * Math.PI * 0.5
    slot.current.scale.setScalar(0.6 + cycle * 0.4)
  })

  return (
    <group rotation={[0.5, -0.72, 0]} position={[-0.1, -0.15, 0]} scale={0.84}>
      <mesh geometry={rbox(1.6, 0.78, 1.6, 0.05)} position={[0, -0.41, 0]} material={m.obsidian} />
      <mesh geometry={rbox(1.6, 0.78, 0.78, 0.05)} position={[0, 0.41, -0.41]} material={m.titanium} />
      <mesh geometry={rbox(0.78, 0.78, 0.78, 0.05)} position={[-0.41, 0.41, 0.41]} material={m.obsidian} />
      <mesh ref={slot} geometry={rbox(0.56, 0.03, 0.56, 0.012)} position={[0.41, 0.0, 0.41]} material={m.spark} />
      <mesh ref={piece} geometry={rbox(0.78, 0.78, 0.78, 0.05)} position={[0.41, 0.41, 0.41]} material={m.bone} />
    </group>
  )
}

/* 06 · Optimización — un indicador cuya aguja sube. */
const TICKS = 13
const GAUGE_START = (225 * Math.PI) / 180
const GAUGE_SWEEP = (270 * Math.PI) / 180

function OptimizeEmblem({ m, state }: EmblemProps) {
  const needle = useRef<Group>(null!)
  const ticks = useRef<(Mesh | null)[]>([])
  const value = useRef(0)

  useFrame((s, delta) => {
    if (state.vis < 0.01) {
      value.current = 0
      return
    }
    const t = s.clock.elapsedTime * rig.motion
    const goal = state.vis > 0.5 ? 0.82 + Math.sin(t * 1.4) * 0.05 : 0
    value.current = damp(value.current, goal, 2.2, Math.min(delta, 0.05))
    needle.current.rotation.z = GAUGE_START - value.current * GAUGE_SWEEP - Math.PI / 2
    ticks.current.forEach((tick, i) => {
      if (tick) tick.material = i / (TICKS - 1) <= value.current ? m.spark : m.titanium
    })
  })

  return (
    <group rotation={[0.1, -0.46, 0]} position={[0, -0.12, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.14]} material={m.obsidian}>
        <cylinderGeometry args={[1.3, 1.3, 0.06, 72]} />
      </mesh>
      <mesh rotation={[0, 0, -Math.PI / 4]} material={m.titanium}>
        <torusGeometry args={[1.14, 0.055, 12, 72, GAUGE_SWEEP]} />
      </mesh>
      {Array.from({ length: TICKS }, (_, i) => {
        const a = GAUGE_START - (i / (TICKS - 1)) * GAUGE_SWEEP
        return (
          <mesh
            key={i}
            ref={(mesh) => {
              ticks.current[i] = mesh
            }}
            geometry={rbox(0.16, 0.05, 0.06, 0.02)}
            position={[Math.cos(a) * 0.9, Math.sin(a) * 0.9, 0]}
            rotation={[0, 0, a]}
            material={m.titanium}
          />
        )
      })}
      <group ref={needle} position={[0, 0, 0.1]}>
        <mesh geometry={rbox(0.07, 0.78, 0.05, 0.02)} position={[0, 0.33, 0]} material={m.bone} />
      </group>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.1]} material={m.obsidian}>
        <cylinderGeometry args={[0.15, 0.15, 0.16, 32]} />
      </mesh>
    </group>
  )
}

export const EMBLEMS: Record<EmblemKind, (props: EmblemProps) => React.JSX.Element> = {
  web: WebEmblem,
  commerce: CommerceEmblem,
  platform: PlatformEmblem,
  automation: AutomationEmblem,
  custom: CustomEmblem,
  optimize: OptimizeEmblem,
}
