import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { type PerspectiveCamera, type PointLight } from 'three'
import { clamp, damp, easeOutCubic, lerp, smootherstep } from '../lib/math'
import { ScrollTrigger } from '../lib/scroll'
import { stage } from '../lib/stage'
import { POSE_KEYS, desktopPoses, initialPose, mobilePoses, type Pose, type SectionKey } from './poses'
import { rig } from './rig'

interface Key {
  y: number
  /** Posición de referencia de la sección (para las poses con `follow`). */
  anchor: number
  pose: Pose
  section: SectionKey
}

const target = initialPose()
const FOV_TAN = Math.tan((35 * Math.PI) / 360)

/** Lee la posición de cada sección en el documento y la convierte en fotogramas clave. */
function measureKeys(compact: boolean): Key[] {
  const poses = compact ? mobilePoses : desktopPoses
  const vh = window.innerHeight
  const keys: Key[] = []
  document.querySelectorAll<HTMLElement>('[data-stage]').forEach((el) => {
    const section = el.dataset.stage as SectionKey
    if (!poses[section]) return
    const rect = el.getBoundingClientRect()
    const top = rect.top + window.scrollY
    const half = Math.min(rect.height, vh) / 2
    const anchor = top + half
    let { in: poseIn, out: poseOut } = poses[section]

    // Si la sección reserva un hueco para la pieza, esta se centra en él y lo
    // acompaña con el scroll: la composición depende del layout, no de un valor fijo.
    const slot = el.querySelector<HTMLElement>('[data-construct-anchor]')
    if (slot) {
      const slotRect = slot.getBoundingClientRect()
      const center = slotRect.top + window.scrollY + slotRect.height / 2
      const y = -(center - anchor) / (vh / 2)
      poseIn = { ...poseIn, y, follow: 1 }
      poseOut = { ...poseOut, y, follow: 1 }
    }

    keys.push({ y: anchor, anchor, pose: poseIn, section })
    if (rect.height > vh + 1) {
      keys.push({ y: top + rect.height - half, anchor, pose: poseOut, section })
    }
  })
  return keys.sort((a, b) => a.y - b.y)
}

const followOf = (key: Key, center: number) => key.pose.follow * (center - key.anchor)

/** Interpola la pose para la posición de scroll dada. Devuelve el desplazamiento `follow` en px. */
function samplePose(keys: Key[], center: number, out: Pose): number {
  if (keys.length === 0) return 0
  const first = keys[0]
  const last = keys[keys.length - 1]
  if (center <= first.y || center >= last.y) {
    const key = center <= first.y ? first : last
    Object.assign(out, key.pose)
    return followOf(key, center)
  }

  let i = 0
  while (i < keys.length - 2 && center > keys[i + 1].y) i++
  const a = keys[i]
  const b = keys[i + 1]
  const linear = clamp((center - a.y) / (b.y - a.y || 1))
  // Dentro de una sección el avance es lineal (lo dicta el scroll);
  // entre secciones, la transición acelera y frena suavemente.
  const hold = a.pose.hold
  const t = a.section === b.section ? linear : smootherstep(clamp((linear - hold) / (1 - hold)))
  for (const k of POSE_KEYS) out[k] = lerp(a.pose[k], b.pose[k], t)
  return lerp(followOf(a, center), followOf(b, center), t)
}

/**
 * Director de escena: traduce el scroll en poses, mueve la cámara y controla
 * la exposición. No renderiza nada visible salvo la luz que sigue al cursor.
 */
export function Director() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const gl = useThree((s) => s.gl)
  const size = useThree((s) => s.size)
  const keys = useRef<Key[]>([])
  const cursorLight = useRef<PointLight>(null!)
  const first = useRef(true)

  useEffect(() => {
    rig.compact = size.width < 900 || size.width / size.height < 0.9
    rig.compactScale = rig.compact ? clamp(size.width / size.height / 0.5, 1, 1.5) : 1
    const measure = () => {
      keys.current = measureKeys(rig.compact)
    }
    measure()
    ScrollTrigger.addEventListener('refresh', measure)
    // Las fuentes y las imágenes cambian las alturas después del primer layout.
    const observer = new ResizeObserver(measure)
    observer.observe(document.body)
    return () => {
      ScrollTrigger.removeEventListener('refresh', measure)
      observer.disconnect()
    }
  }, [size.width, size.height])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    rig.motion = stage.reducedMotion ? 0 : 1

    rig.followPx = samplePose(keys.current, window.scrollY + window.innerHeight / 2, target)
    const L = rig.live
    if (first.current) {
      Object.assign(L, target)
      first.current = false
    } else {
      for (const k of POSE_KEYS) L[k] = damp(L[k], target[k], k === 'build' ? 9 : 5, dt)
    }

    const pointerOn = stage.pointer.active && rig.motion > 0
    rig.px = damp(rig.px, pointerOn ? stage.pointer.x : 0, 3.5, dt)
    rig.py = damp(rig.py, pointerOn ? stage.pointer.y : 0, 3.5, dt)

    // Cámara: travelling de entrada + paralaje sutil con el cursor.
    const intro = easeOutCubic(stage.intro.value)
    const z = L.camZ + (1 - intro) * 5
    camera.position.set(rig.px * 0.45, rig.py * 0.28 + (1 - intro) * 0.6, z)
    camera.lookAt(0, 0, 0)
    camera.updateMatrixWorld()

    rig.hh = FOV_TAN * L.camZ
    rig.hw = rig.hh * camera.aspect

    gl.toneMappingExposure = L.exposure * (0.05 + 0.95 * intro)

    // Luz violeta que acompaña al cursor: los metales responden al movimiento.
    cursorLight.current.position.set(rig.px * rig.hw * 0.9, rig.py * rig.hh * 0.9, 3.2)
    cursorLight.current.intensity = (pointerOn ? 9 : 2.5) * intro
  })

  return (
    <>
      <ambientLight intensity={0.18} />
      <directionalLight position={[5, 7, 6]} intensity={1.5} color="#f3f1ff" />
      <directionalLight position={[-7, 2, -4]} intensity={1.8} color="#7d5cff" />
      <pointLight ref={cursorLight} color="#8f7dff" intensity={0} distance={11} decay={1.6} />
    </>
  )
}
