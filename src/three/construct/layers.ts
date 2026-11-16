import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  ShaderMaterial,
  SRGBColorSpace,
} from 'three'
import { mulberry32 } from '../../lib/math'
import type { BlockDef } from './partition'

/* ───── Etapa 1 del proceso: partículas que convergen hacia la forma ───── */

export function createPointsGeometry(blocks: BlockDef[], count: number): BufferGeometry {
  const rnd = mulberry32(91)
  const areas = blocks.map((b) => 2 * (b.size[0] * b.size[1] + b.size[1] * b.size[2] + b.size[0] * b.size[2]))
  const total = areas.reduce((a, b) => a + b, 0)

  const position = new Float32Array(count * 3)
  const scatter = new Float32Array(count * 3)
  const rand = new Float32Array(count * 2)

  let p = 0
  blocks.forEach((block, bi) => {
    const share = bi === blocks.length - 1 ? count - p : Math.round((areas[bi] / total) * count)
    for (let i = 0; i < share && p < count; i++, p++) {
      // Punto aleatorio sobre una cara del bloque.
      const face = Math.floor(rnd() * 3)
      const sign = rnd() < 0.5 ? -1 : 1
      const u = [rnd() - 0.5, rnd() - 0.5, rnd() - 0.5]
      u[face] = 0.5 * sign
      position[p * 3] = block.home.x + u[0] * block.size[0]
      position[p * 3 + 1] = block.home.y + u[1] * block.size[1]
      position[p * 3 + 2] = block.home.z + u[2] * block.size[2]

      // Posición dispersa: una nube amplia alrededor de la pieza.
      const theta = rnd() * Math.PI * 2
      const phi = Math.acos(rnd() * 2 - 1)
      const radius = 1.5 + rnd() * 2.5
      scatter[p * 3] = Math.sin(phi) * Math.cos(theta) * radius
      scatter[p * 3 + 1] = Math.cos(phi) * radius * 0.8
      scatter[p * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius

      rand[p * 2] = rnd()
      rand[p * 2 + 1] = rnd()
    }
  })

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(position, 3))
  geometry.setAttribute('aScatter', new BufferAttribute(scatter, 3))
  geometry.setAttribute('aRand', new BufferAttribute(rand, 2))
  return geometry
}

export function createPointsMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: {
      uConverge: { value: 0 },
      uAlpha: { value: 0 },
      uTime: { value: 0 },
      uSize: { value: 30 },
      uColorA: { value: new Color('#e8eaff') },
      uColorB: { value: new Color('#8f7dff') },
    },
    vertexShader: /* glsl */ `
      uniform float uConverge;
      uniform float uTime;
      uniform float uSize;
      attribute vec3 aScatter;
      attribute vec2 aRand;
      varying float vMix;
      varying float vFade;

      void main() {
        // Cada partícula llega con su propio retraso.
        float t = clamp(uConverge * 1.5 - aRand.x * 0.5, 0.0, 1.0);
        t = t * t * (3.0 - 2.0 * t);

        // Mientras está dispersa, la nube gira lentamente.
        vec3 cloud = aScatter;
        float angle = uTime * 0.12 + aRand.y * 0.6;
        float c = cos(angle), s = sin(angle);
        cloud.xz = mat2(c, -s, s, c) * cloud.xz;
        cloud.y += sin(uTime * 0.4 + aRand.x * 6.2831) * 0.12;

        vec3 p = mix(cloud, position, t);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * (0.55 + aRand.y * 0.9) * mix(1.5, 1.0, t) / -mv.z;
        vMix = step(0.86, aRand.x);
        vFade = mix(0.75, 1.0, t);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uAlpha;
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      varying float vMix;
      varying float vFade;

      void main() {
        float d = length(gl_PointCoord - 0.5);
        float disc = smoothstep(0.5, 0.12, d);
        gl_FragColor = vec4(mix(uColorA, uColorB, vMix), disc * uAlpha * vFade);
      }
    `,
  })
}

/* ───── Etapa 2 del proceso: aristas que se dibujan (el "plano" de la pieza) ───── */

const EDGE_PAIRS = [
  [0, 1], [1, 3], [3, 2], [2, 0], // cara inferior
  [4, 5], [5, 7], [7, 6], [6, 4], // cara superior
  [0, 4], [1, 5], [2, 6], [3, 7], // verticales
]

export function createEdgesGeometry(blocks: BlockDef[]): BufferGeometry {
  const rnd = mulberry32(57)
  const position: number[] = []
  const edge: number[] = []

  for (const block of blocks) {
    const [w, h, d] = block.size
    const corners = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => [
      block.home.x + (i & 1 ? w / 2 : -w / 2),
      block.home.y + (i & 4 ? h / 2 : -h / 2),
      block.home.z + (i & 2 ? d / 2 : -d / 2),
    ])
    for (const [a, b] of EDGE_PAIRS) {
      const order = block.order * 0.75 + rnd() * 0.25
      position.push(...corners[a], ...corners[b])
      // (posición a lo largo de la arista, orden de dibujo)
      edge.push(0, order, 1, order)
    }
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(position), 3))
  geometry.setAttribute('aEdge', new BufferAttribute(new Float32Array(edge), 2))
  return geometry
}

export function createEdgesMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uDraw: { value: 0 },
      uAlpha: { value: 0 },
      uColor: { value: new Color('#b9b4ff') },
      uHead: { value: new Color('#ccff0e') },
    },
    vertexShader: /* glsl */ `
      attribute vec2 aEdge;
      varying vec2 vEdge;
      void main() {
        vEdge = aEdge;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uDraw;
      uniform float uAlpha;
      uniform vec3 uColor;
      uniform vec3 uHead;
      varying vec2 vEdge;
      void main() {
        // Cada arista se traza de un extremo al otro según su orden.
        float local = clamp((uDraw * 1.35 - vEdge.y) / 0.35, 0.0, 1.0);
        if (vEdge.x > local) discard;
        float head = smoothstep(0.12, 0.0, local - vEdge.x) * step(local, 0.999);
        gl_FragColor = vec4(mix(uColor, uHead, head), uAlpha * mix(0.6, 1.0, head));
      }
    `,
  })
}

/* ───── Halo radial (blanco: cada material lo tiñe con su color) ───── */

export function createGlowTexture(): CanvasTexture {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
  gradient.addColorStop(0.25, 'rgba(255, 255, 255, 0.45)')
  gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.1)')
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}
