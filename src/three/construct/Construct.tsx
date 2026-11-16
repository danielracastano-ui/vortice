import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  DoubleSide,
  type Group,
  type LineSegments,
  type Mesh,
  type Points,
  type Sprite,
  SpriteMaterial,
  Vector3,
} from 'three'
import { clamp, damp, easeInOutCubic, easeOutCubic, easeOutQuart, smoothstep } from '../../lib/math'
import { stage } from '../../lib/stage'
import { rbox } from '../geometry'
import { createMaterials, disposeMaterials, scanUniforms } from '../materials'
import { shapeBuild } from '../poses'
import { rig } from '../rig'
import {
  createEdgesGeometry,
  createEdgesMaterial,
  createGlowTexture,
  createPointsGeometry,
  createPointsMaterial,
} from './layers'
import { createPartition } from './partition'

const tmp = new Vector3()
const ringPos = new Vector3()
const projected = new Vector3()
const UP = new Vector3(0, 1, 0)

/**
 * El constructo: un cubo dividido en módulos de distintos tamaños y materiales.
 * Es la metáfora central del sitio —un sistema hecho de piezas a medida— y
 * cambia de estado según la sección: ensamblado, explosionado, en órbita,
 * o construyéndose etapa por etapa durante "Proceso".
 */
export function Construct() {
  const camera = useThree((s) => s.camera)
  const group = useRef<Group>(null!)
  const meshes = useRef<(Mesh | null)[]>([])
  const halos = useRef<(Sprite | null)[]>([])
  const points = useRef<Points>(null!)
  const edges = useRef<LineSegments>(null!)
  const scanPlane = useRef<Mesh>(null!)
  const backGlow = useRef<Sprite>(null!)
  const spin = useRef(0)

  const blocks = useMemo(() => createPartition(), [])
  const push = useMemo(() => new Float32Array(blocks.length), [blocks])
  const coreBlocks = useMemo(() => blocks.filter((b) => b.mat === 'core'), [blocks])

  const assets = useMemo(() => {
    const glowTexture = createGlowTexture()
    return {
      materials: createMaterials(stage.tier, { scan: true }),
      pointsGeometry: createPointsGeometry(blocks, stage.tier === 'high' ? 2600 : 1400),
      pointsMaterial: createPointsMaterial(),
      edgesGeometry: createEdgesGeometry(blocks),
      edgesMaterial: createEdgesMaterial(),
      glowTexture,
      haloMaterial: new SpriteMaterial({
        map: glowTexture,
        color: '#6f58ff',
        blending: AdditiveBlending,
        depthWrite: false,
        transparent: true,
        opacity: 0,
      }),
      backGlowMaterial: new SpriteMaterial({
        map: glowTexture,
        color: '#5b3dff',
        blending: AdditiveBlending,
        depthWrite: false,
        depthTest: false,
        transparent: true,
        opacity: 0,
        fog: false,
      }),
    }
  }, [blocks])

  useEffect(
    () => () => {
      disposeMaterials(assets.materials)
      assets.pointsGeometry.dispose()
      assets.pointsMaterial.dispose()
      assets.edgesGeometry.dispose()
      assets.edgesMaterial.dispose()
      assets.glowTexture.dispose()
      assets.haloMaterial.dispose()
      assets.backGlowMaterial.dispose()
    },
    [assets],
  )

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const L = rig.live
    const g = group.current
    const t = state.clock.elapsedTime * rig.motion
    const intro = stage.intro.value

    const presence = 1 - smoothstep(0.55, 1, L.scatter)
    const b = shapeBuild(L.build)
    const building = b < 3.999

    /* ── Transformación del conjunto ── */
    spin.current += L.spin * dt * rig.motion
    // `followPx` desplaza la pieza junto con el contenido (px → unidades de mundo).
    const followY = (rig.followPx / state.size.height) * 2 * rig.hh
    g.position.set(L.x * rig.hw, L.y * rig.hh + followY, 0)
    const scale = L.scale * rig.compactScale
    g.scale.setScalar(scale)
    g.rotation.set(L.rx - rig.py * 0.16, L.ry + spin.current + rig.px * 0.32, 0)
    g.updateMatrixWorld()

    const visible = presence > 0.001 || (building && L.scatter < 0.999)
    g.visible = visible

    /* ── Resplandor de fondo: sitúa la pieza en el espacio ── */
    const glowSprite = backGlow.current
    glowSprite.position.set(g.position.x, g.position.y - 0.4 * scale, -3)
    glowSprite.scale.setScalar(9 * scale)
    assets.backGlowMaterial.opacity = (0.22 + L.glow * 0.14) * (1 - L.scatter) * easeOutCubic(intro)
    glowSprite.visible = assets.backGlowMaterial.opacity > 0.004

    if (!visible) {
      scanPlane.current.visible = false
      rig.construct.orbit = 0
      return
    }

    /* ── Capas del proceso ── */
    // Las capas de partículas y trazos solo existen cuando la pieza no está dispersa:
    // evita "fantasmas" al cruzar varias secciones de un salto.
    const layerPresence = 1 - smoothstep(0, 0.35, L.scatter)
    const pointsAlpha = building ? (1 - smoothstep(1.25, 2.1, b)) * layerPresence : 0
    points.current.visible = pointsAlpha > 0.003
    if (points.current.visible) {
      const u = assets.pointsMaterial.uniforms
      u.uConverge.value = clamp(b)
      u.uAlpha.value = pointsAlpha * 0.9
      u.uTime.value = t
      u.uSize.value = 30 * state.viewport.dpr * scale
    }

    const edgesAlpha = building
      ? smoothstep(1.0, 1.12, b) * (1 - smoothstep(2.55, 3.1, b)) * layerPresence
      : 0
    edges.current.visible = edgesAlpha > 0.003
    if (edges.current.visible) {
      assets.edgesMaterial.uniforms.uDraw.value = clamp(b - 1)
      assets.edgesMaterial.uniforms.uAlpha.value = edgesAlpha * 0.85
    }

    const solidT = building ? clamp(b - 2) : 1
    const scanT = clamp(b - 3)
    const scanning = b > 3.001 && building

    // Barrido de verificación: de la base a la cima, en coordenadas de mundo.
    const reach = 1.8 * scale
    const scanY = g.position.y - reach + 2 * reach * scanT
    scanUniforms.uScanY.value = !building ? 1e5 : b <= 3 ? -1e5 : scanY
    scanUniforms.uScanBand.value = scanning ? Math.sin(scanT * Math.PI) : 0
    scanPlane.current.visible = scanning
    if (scanning) {
      scanPlane.current.position.set(g.position.x, scanY, 0)
      scanPlane.current.scale.setScalar(scale)
      const m = scanPlane.current.material as { opacity: number }
      m.opacity = 0.07 * Math.sin(scanT * Math.PI)
    }

    /* ── Bloques ── */
    const explode = L.explode
    const ringW = L.ring > 0.001 ? easeInOutCubic(L.ring) : 0
    const ringR = (Math.min(rig.hw, 7) * 0.86) / scale
    const pointerOn = stage.pointer.active && rig.motion > 0 && explode < 0.6 && ringW === 0

    for (let i = 0; i < blocks.length; i++) {
      const d = blocks[i]
      const mesh = meshes.current[i]
      if (!mesh) continue

      tmp.copy(d.home).multiplyScalar(1 + explode * 1.15).addScaledVector(d.dir, explode * 0.3)
      tmp.addScaledVector(d.dir, Math.sin(t * 0.7 + d.phase) * (0.012 + explode * 0.03))

      if (ringW > 0) {
        const a = d.ringAngle + t * 0.09
        ringPos.set(Math.cos(a) * ringR, Math.sin(a * 3 + d.phase) * 0.16, Math.sin(a) * ringR)
        tmp.lerp(ringPos, ringW)
      }
      if (L.scatter > 0.001) {
        // Al dispersarse, los bloques también salen en espiral.
        tmp.addScaledVector(d.dir, L.scatter * L.scatter * 9).applyAxisAngle(UP, L.scatter * 1.4)
      }

      // Entrada en vórtice: cada bloque llega desde lejos girando en espiral
      // alrededor del eje de la pieza, con su propio retraso.
      const introE = easeOutQuart(clamp(intro * 1.7 - d.introDelay * 0.7))
      if (introE < 1) {
        tmp.lerpVectors(d.introFrom, tmp, introE).applyAxisAngle(UP, (1 - introE) * 2.6)
      }

      // El bloque más cercano al cursor se separa ligeramente del conjunto.
      let target = 0
      if (pointerOn) {
        projected.copy(tmp).applyMatrix4(g.matrixWorld).project(camera)
        const dx = projected.x - stage.pointer.x
        const dy = (projected.y - stage.pointer.y) / camera.projectionMatrix.elements[5] * camera.projectionMatrix.elements[0]
        target = Math.exp(-(dx * dx + dy * dy) / 0.012) * 0.2
      }
      push[i] = damp(push[i], target, 6, dt)
      tmp.addScaledVector(d.dir, push[i])

      const build = building ? easeOutCubic(clamp(solidT * 1.7 - d.order * 0.7)) : 1
      const s = presence * build * (0.2 + 0.8 * introE) * (introE > 0.002 ? 1 : 0)
      mesh.visible = s > 0.002
      if (!mesh.visible) continue

      mesh.position.copy(tmp)
      mesh.scale.setScalar(s)
      const angle =
        explode * 0.2 * d.twist +
        ringW * (t * 0.25 + d.phase) +
        L.scatter * 2.4 * d.twist +
        (1 - introE) * 3 * d.twist +
        (1 - build) * 0.6
      mesh.quaternion.setFromAxisAngle(d.axis, angle)
    }

    /* ── Núcleo violeta: emisión y halos ── */
    const finished = building ? smoothstep(3.6, 4, b) : 1

    // Los anillos orbitales solo acompañan a la pieza terminada y ensamblada.
    const c = rig.construct
    c.x = g.position.x
    c.y = g.position.y
    c.scale = scale
    c.orbit =
      finished *
      presence *
      (1 - smoothstep(0.08, 0.4, explode)) *
      (1 - smoothstep(0, 0.3, L.ring)) *
      smoothstep(0.6, 1, intro)
    assets.materials.core.emissiveIntensity = 0.75 + L.glow * 0.5
    assets.haloMaterial.opacity = clamp(0.22 + L.glow * 0.3) * finished * presence * easeOutCubic(intro)
    for (let i = 0; i < coreBlocks.length; i++) {
      const halo = halos.current[i]
      const mesh = meshes.current[coreBlocks[i].index]
      if (!halo || !mesh) continue
      halo.visible = mesh.visible && assets.haloMaterial.opacity > 0.01
      halo.position.copy(mesh.position)
      halo.scale.setScalar((1.7 + L.glow * 0.8) * mesh.scale.x)
    }
  })

  return (
    <>
      <sprite ref={backGlow} material={assets.backGlowMaterial} renderOrder={-1} />
      <mesh ref={scanPlane} rotation-x={-Math.PI / 2} visible={false}>
        <planeGeometry args={[4.2, 4.2]} />
        <meshBasicMaterial
          color="#ccff0e"
          transparent
          opacity={0}
          blending={AdditiveBlending}
          depthWrite={false}
          side={DoubleSide}
          fog={false}
        />
      </mesh>
      <group ref={group}>
        {blocks.map((block, i) => (
          <mesh
            key={block.index}
            ref={(m) => {
              meshes.current[i] = m
            }}
            geometry={rbox(block.size[0], block.size[1], block.size[2])}
            material={assets.materials[block.mat]}
            position={block.introFrom}
            visible={false}
          />
        ))}
        {coreBlocks.map((block, i) => (
          <sprite
            key={block.index}
            ref={(s) => {
              halos.current[i] = s
            }}
            material={assets.haloMaterial}
            visible={false}
          />
        ))}
        <points
          ref={points}
          geometry={assets.pointsGeometry}
          material={assets.pointsMaterial}
          frustumCulled={false}
          visible={false}
        />
        <lineSegments
          ref={edges}
          geometry={assets.edgesGeometry}
          material={assets.edgesMaterial}
          frustumCulled={false}
          visible={false}
        />
      </group>
    </>
  )
}
