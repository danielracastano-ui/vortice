import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { type Group, Vector3 } from 'three'
import { services } from '../../content/services'
import { damp, easeInOutCubic } from '../../lib/math'
import { stage } from '../../lib/stage'
import { createMaterials, disposeMaterials } from '../materials'
import { rig } from '../rig'
import { EMBLEMS } from './emblems'

const ray = new Vector3()

/**
 * Anfitrión de los emblemas de servicios.
 *
 * Cada emblema se ancla a un hueco del DOM: su posición y tamaño en pantalla
 * se proyectan al espacio 3D en cada frame. Así el objeto acompaña al layout
 * (y al scroll) en cualquier tamaño de pantalla sin coordenadas mágicas.
 */
export function ServiceEmblems() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const groups = useRef<(Group | null)[]>([])
  const materials = useMemo(() => {
    const set = createMaterials(stage.tier)
    // Los emblemas se leen sobre fondo negro: metales algo más claros que en el constructo.
    set.obsidian.color.set('#222848')
    set.obsidian.roughness = 0.24
    set.titanium.color.set('#a7abcc')
    return set
  }, [])
  const states = useMemo(() => services.map(() => ({ vis: 0, dir: 1 })), [])
  const spin = useRef({ pulse: 0, velocity: 0, angle: 0 })

  useEffect(() => () => disposeMaterials(materials), [materials])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)

    // Un hover sobre el servicio da un impulso de giro al emblema.
    const s = spin.current
    if (stage.servicePulse !== s.pulse) {
      s.pulse = stage.servicePulse
      if (rig.motion > 0) s.velocity += 5
    }
    s.velocity = damp(s.velocity, 0, 2.6, dt)
    s.angle += s.velocity * dt

    const worldPerPx = (2 * rig.hh) / size.height

    for (let i = 0; i < services.length; i++) {
      const group = groups.current[i]
      const state = states[i]
      const slot = stage.emblemSlots[i]
      if (!group) continue

      let wanted = false
      let rect: DOMRect | null = null
      if (slot && (!stage.emblemShared || stage.activeService === i)) {
        rect = slot.getBoundingClientRect()
        wanted = rect.bottom > -40 && rect.top < size.height + 40 && rect.width > 0
      }

      const previous = state.vis
      state.vis = damp(state.vis, wanted ? 1 : 0, wanted ? 4.5 : 7, dt)
      if (Math.abs(state.vis - previous) > 1e-5) state.dir = wanted ? 1 : -1

      if (state.vis < 0.004) {
        group.visible = false
        continue
      }
      group.visible = true
      if (!rect && slot) rect = slot.getBoundingClientRect()
      if (!rect) continue

      // Centro del hueco → rayo desde la cámara → punto en el plano z = 0.
      const nx = ((rect.left + rect.width / 2) / size.width) * 2 - 1
      const ny = -(((rect.top + rect.height / 2) / size.height) * 2 - 1)
      ray.set(nx, ny, 0.5).unproject(camera).sub(camera.position).normalize()
      const distance = -camera.position.z / ray.z
      group.position.copy(camera.position).addScaledVector(ray, distance)

      const ease = easeInOutCubic(state.vis)
      const fit = Math.min(rect.width, rect.height) * worldPerPx * 0.36
      // Los emblemas entran desde abajo y salen hacia arriba, como una cinta vertical.
      group.position.y -= (1 - ease) * fit * 1.4 * state.dir
      group.scale.setScalar(fit * ease)
      group.rotation.set(
        -rig.py * 0.22,
        (1 - ease) * -1.5 * state.dir + rig.px * 0.4 + s.angle,
        0,
      )
    }
  })

  return (
    <>
      {services.map((service, i) => {
        const Emblem = EMBLEMS[service.emblem]
        return (
          <group
            key={service.id}
            ref={(g) => {
              groups.current[i] = g
            }}
            visible={false}
          >
            <Emblem m={materials} state={states[i]} />
          </group>
        )
      })}
    </>
  )
}
