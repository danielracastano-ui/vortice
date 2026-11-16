import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import { NeutralToneMapping } from 'three'
import type { GfxTier } from '../lib/device'
import { stage } from '../lib/stage'
import { Construct } from './construct/Construct'
import { Orbit } from './construct/Orbit'
import { Director } from './Director'
import { Dust } from './Dust'
import { ServiceEmblems } from './emblems/ServiceEmblems'
import { createEnvironment } from './environment'
import { disposeGeometryCache } from './geometry'
import { downgradeGlass } from './materials'

interface ExperienceProps {
  tier: Exclude<GfxTier, 'off'>
  /** Pausa el render (pestaña oculta, modal abierto…). */
  paused: boolean
  onReady: () => void
  /** Se invoca si el contexto WebGL falla: la app muestra la alternativa en CSS. */
  onFail: () => void
}

/** Genera el entorno de reflejos y avisa cuando los shaders están compilados. */
function SceneSetup({ onReady }: { onReady: () => void }) {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)

  useEffect(() => {
    const environment = createEnvironment(gl)
    scene.environment = environment
    let cancelled = false
    const done = () => {
      if (!cancelled) onReady()
    }
    // Compilar por adelantado evita tirones en la animación de entrada.
    gl.compileAsync(scene, camera).then(done, done)
    return () => {
      cancelled = true
      scene.environment = null
      environment.dispose()
      disposeGeometryCache()
    }
  }, [gl, scene, camera, onReady])

  return null
}

/**
 * Vigila el framerate real tras la entrada. Si el equipo no llega, reduce
 * resolución y simplifica el cristal en lugar de dejar que la página se arrastre.
 */
function PerformanceGovernor({ onDegrade }: { onDegrade: (level: number) => void }) {
  const sample = useRef({ frames: 0, time: 0, level: 0, warmup: 0 })

  useFrame((_, delta) => {
    const s = sample.current
    if (stage.intro.value < 1 || s.level >= 2 || document.hidden) return
    if (s.warmup < 30) {
      s.warmup++
      return
    }
    if (delta > 0.25) return // cambio de pestaña o pausa: no cuenta
    s.frames++
    s.time += delta
    if (s.frames < 90) return
    const average = s.time / s.frames
    s.frames = 0
    s.time = 0
    if (average > 1 / 34) {
      s.level++
      s.warmup = 0
      onDegrade(s.level)
    }
  })

  return null
}

export default function Experience({ tier, paused, onReady, onFail }: ExperienceProps) {
  const [maxDpr, setMaxDpr] = useState(tier === 'high' ? 1.75 : 1.5)

  const handleDegrade = (level: number) => {
    if (level === 1) {
      setMaxDpr(1.25)
      downgradeGlass()
    } else {
      setMaxDpr(1)
    }
  }

  return (
    <Canvas
      className="experience"
      dpr={[1, maxDpr]}
      frameloop={paused ? 'never' : 'always'}
      camera={{ fov: 35, near: 0.1, far: 60, position: [0, 0, 15] }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance', stencil: false }}
      onCreated={({ gl }) => {
        gl.toneMapping = NeutralToneMapping
        gl.toneMappingExposure = 0.05
        gl.domElement.addEventListener('webglcontextlost', (event) => {
          event.preventDefault()
          onFail()
        })
      }}
      fallback={null}
      aria-hidden="true"
      tabIndex={-1}
      style={{ pointerEvents: 'none' }}
    >
      <color attach="background" args={['#090e21']} />
      <fog attach="fog" args={['#090e21', 13, 30]} />
      <SceneSetup onReady={onReady} />
      <Director />
      <Construct />
      <Orbit />
      <ServiceEmblems />
      <Dust />
      <PerformanceGovernor onDegrade={handleDegrade} />
    </Canvas>
  )
}
