import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  BufferAttribute,
  Color,
  type Group,
  MeshBasicMaterial,
  Quaternion,
  SpriteMaterial,
  TorusGeometry,
} from 'three'
import { damp } from '../../lib/math'
import { rig } from '../rig'
import { createGlowTexture } from './layers'

const RADIUS = 1.98
const GAP = 0.38 // abertura del aro, como en el logotipo (≈ 21,5°)
const ARC = Math.PI * 2 - GAP
const q = new Quaternion()
const STOPS = [new Color('#4b1de9'), new Color('#4d4dfe'), new Color('#7d4aff')]

/** Aro fino con el degradado índigo → violeta del logotipo, pintado por vértice. */
function createRing(radius: number, tube: number, arc: number): TorusGeometry {
  const geometry = new TorusGeometry(radius, tube, 8, 180, arc)
  const position = geometry.attributes.position
  const colors = new Float32Array(position.count * 3)
  const color = new Color()
  for (let i = 0; i < position.count; i++) {
    const angle = Math.atan2(position.getY(i), position.getX(i))
    const t = 0.5 + 0.5 * Math.cos(angle - 0.6)
    if (t < 0.5) color.lerpColors(STOPS[0], STOPS[1], t * 2)
    else color.lerpColors(STOPS[1], STOPS[2], (t - 0.5) * 2)
    colors.set([color.r, color.g, color.b], i * 3)
  }
  geometry.setAttribute('color', new BufferAttribute(colors, 3))
  return geometry
}

/**
 * Los anillos del logotipo llevados al espacio: un aro abierto con el punto
 * lima en su hueco y una segunda órbita más tenue. Rodean a la pieza cuando
 * está ensamblada y terminada —"en órbita"— y se retiran en el resto de estados.
 */
export function Orbit() {
  const camera = useThree((s) => s.camera)
  const root = useRef<Group>(null!)
  const primary = useRef<Group>(null!)
  const secondary = useRef<Group>(null!)
  const spark = useRef<Group>(null!)
  const presence = useRef(0)

  const assets = useMemo(() => {
    const glow = createGlowTexture()
    return {
      glow,
      ringA: createRing(RADIUS, 0.017, ARC),
      ringB: createRing(RADIUS * 1.16, 0.008, Math.PI * 2),
      sparkRing: new TorusGeometry(0.085, 0.03, 10, 36),
      line: new MeshBasicMaterial({ vertexColors: true, transparent: true, toneMapped: false, fog: false }),
      faint: new MeshBasicMaterial({ vertexColors: true, transparent: true, toneMapped: false, fog: false }),
      lime: new MeshBasicMaterial({ color: '#ccff0e', transparent: true, toneMapped: false, fog: false }),
      halo: new SpriteMaterial({
        map: glow,
        color: '#ccff0e',
        blending: AdditiveBlending,
        depthWrite: false,
        transparent: true,
        opacity: 0,
        fog: false,
      }),
    }
  }, [])

  useEffect(
    () => () => {
      Object.values(assets).forEach((asset) => asset.dispose())
    },
    [assets],
  )

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const c = rig.construct
    presence.current = damp(presence.current, c.orbit, c.orbit > presence.current ? 2.2 : 6, dt)
    const p = presence.current
    const g = root.current
    g.visible = p > 0.004
    if (!g.visible) return

    g.position.set(c.x, c.y, 0)
    g.scale.setScalar(c.scale * (0.72 + 0.28 * p))
    g.rotation.set(-rig.py * 0.1, rig.px * 0.18, 0)

    const t = state.clock.elapsedTime * rig.motion
    primary.current.rotation.z = 0.9 + t * 0.22
    secondary.current.rotation.z = -t * 0.1

    assets.line.opacity = p
    assets.faint.opacity = p * 0.5
    assets.lime.opacity = p
    assets.halo.opacity = p * 0.5

    // El punto lima mira siempre a cámara, como el aro plano del logotipo.
    const parent = spark.current.parent!
    parent.updateWorldMatrix(true, false)
    spark.current.quaternion.copy(camera.quaternion).premultiply(parent.getWorldQuaternion(q).invert())
  })

  const sparkAngle = ARC + GAP / 2

  return (
    <group ref={root} visible={false}>
      <group rotation={[1.2, 0, -0.32]}>
        <group ref={primary}>
          <mesh geometry={assets.ringA} material={assets.line} />
          <group
            ref={spark}
            position={[Math.cos(sparkAngle) * RADIUS, Math.sin(sparkAngle) * RADIUS, 0]}
          >
            <mesh geometry={assets.sparkRing} material={assets.lime} />
            <sprite material={assets.halo} scale={0.7} />
          </group>
        </group>
      </group>
      <group rotation={[0.92, 0.55, 0.45]}>
        <group ref={secondary}>
          <mesh geometry={assets.ringB} material={assets.faint} />
        </group>
      </group>
    </group>
  )
}
