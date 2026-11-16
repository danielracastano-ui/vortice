import { ExtrudeGeometry, Path, Shape, type BufferGeometry } from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

const cache = new Map<string, BufferGeometry>()

/** Caja de cantos redondeados, compartida por tamaño (menos geometrías en GPU). */
export function rbox(w: number, h: number, d: number, radius = 0.035): BufferGeometry {
  const r = Math.min(radius, Math.min(w, h, d) / 2 - 0.001)
  const key = `box:${w.toFixed(3)}:${h.toFixed(3)}:${d.toFixed(3)}:${r.toFixed(3)}`
  let geometry = cache.get(key)
  if (!geometry) {
    geometry = new RoundedBoxGeometry(w, h, d, 3, r)
    cache.set(key, geometry)
  }
  return geometry
}

/** Engranaje extruido con un diente centrado en el ángulo 0. */
export function gear(teeth: number, outer: number, root: number, hole: number, depth: number): BufferGeometry {
  const key = `gear:${teeth}:${outer}:${root}:${hole}:${depth}`
  const cached = cache.get(key)
  if (cached) return cached

  const shape = new Shape()
  const step = (Math.PI * 2) / teeth
  const profile: [number, number][] = [
    [0, root], [0.24, root], [0.36, outer], [0.64, outer], [0.76, root],
  ]
  for (let i = 0; i < teeth; i++) {
    for (const [f, r] of profile) {
      const a = (i + f - 0.5) * step
      const x = Math.cos(a) * r
      const y = Math.sin(a) * r
      if (i === 0 && f === 0) shape.moveTo(x, y)
      else shape.lineTo(x, y)
    }
  }
  shape.closePath()
  const bore = new Path()
  bore.absarc(0, 0, hole, 0, Math.PI * 2, true)
  shape.holes.push(bore)

  const geometry = new ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSize: 0.018,
    bevelThickness: 0.018,
    bevelSegments: 2,
    curveSegments: 28,
  })
  geometry.translate(0, 0, -depth / 2)
  cache.set(key, geometry)
  return geometry
}

export function disposeGeometryCache() {
  cache.forEach((g) => g.dispose())
  cache.clear()
}
