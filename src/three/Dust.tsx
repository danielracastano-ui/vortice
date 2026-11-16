import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import { BufferAttribute, BufferGeometry, Color, ShaderMaterial } from 'three'
import { mulberry32 } from '../lib/math'
import { stage } from '../lib/stage'
import { rig } from './rig'

/**
 * Polvo en suspensión: da profundidad al espacio y hace visible el recorrido
 * del scroll (las capas cercanas se desplazan más que las lejanas).
 */
export function Dust() {
  const { geometry, material } = useMemo(() => {
    const count = stage.tier === 'high' ? 900 : 420
    const rnd = mulberry32(5)
    const position = new Float32Array(count * 3)
    const rand = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      position[i * 3] = (rnd() - 0.5) * 26
      position[i * 3 + 1] = (rnd() - 0.5) * 16
      position[i * 3 + 2] = -9 + rnd() * 14
      rand[i] = rnd()
    }
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(position, 3))
    geometry.setAttribute('aRand', new BufferAttribute(rand, 1))

    const material = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uScroll: { value: 0 },
        uDpr: { value: 1 },
        uAlpha: { value: 0 },
        uColor: { value: new Color('#dfe2ff') },
        uAccent: { value: new Color('#8f7dff') },
      },
      vertexShader: /* glsl */ `
        uniform float uTime;
        uniform float uScroll;
        uniform float uDpr;
        attribute float aRand;
        varying float vAlpha;
        varying float vAccent;
        void main() {
          vec3 p = position;
          // Paralaje por profundidad: lo cercano recorre más distancia.
          float depth = (p.z + 9.0) / 14.0;
          p.y = mod(p.y + uScroll * (0.35 + depth * 1.4) + uTime * 0.05 * (0.4 + aRand) + 8.0, 16.0) - 8.0;
          p.x += sin(uTime * 0.15 + aRand * 6.2831) * 0.25;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = uDpr * (10.0 + aRand * 26.0) / -mv.z;
          vAlpha = (0.25 + aRand * 0.55) * smoothstep(8.0, 6.0, abs(p.y)) * smoothstep(1.5, 4.0, -mv.z);
          vAccent = step(0.93, aRand);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uAlpha;
        uniform vec3 uColor;
        uniform vec3 uAccent;
        varying float vAlpha;
        varying float vAccent;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float disc = smoothstep(0.5, 0.05, d);
          gl_FragColor = vec4(mix(uColor, uAccent, vAccent), disc * vAlpha * uAlpha);
        }
      `,
    })
    return { geometry, material }
  }, [])

  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )

  useFrame((state) => {
    const u = material.uniforms
    u.uTime.value = state.clock.elapsedTime * rig.motion
    u.uScroll.value = window.scrollY / Math.max(1, window.innerHeight)
    u.uDpr.value = state.viewport.dpr
    u.uAlpha.value = Math.min(1, stage.intro.value * 1.5) * 0.55
  })

  return <points geometry={geometry} material={material} frustumCulled={false} />
}
