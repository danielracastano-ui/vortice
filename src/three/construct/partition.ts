import { Vector3 } from 'three'
import { mulberry32 } from '../../lib/math'
import type { MatKey } from '../materials'

export interface BlockDef {
  index: number
  /** Dimensiones en unidades de mundo. */
  size: [number, number, number]
  /** Posición ensamblada (centro del bloque). */
  home: Vector3
  mat: MatKey
  /** Orden de construcción, 0 (base) → 1 (cima). */
  order: number
  /** Dirección de salida al explosionar o dispersarse. */
  dir: Vector3
  axis: Vector3
  phase: number
  twist: number
  introFrom: Vector3
  introDelay: number
  ringAngle: number
}

/**
 * Divide un cubo de n³ celdas en bloques rectangulares de tamaños distintos.
 * El resultado es determinista (misma semilla → misma pieza): la forma del
 * constructo es parte de la identidad, no un accidente.
 */
export function createPartition(seed = 23, n = 4, unit = 0.5, gap = 0.04): BlockDef[] {
  const rnd = mulberry32(seed)
  const occupied = new Uint8Array(n * n * n)
  const at = (x: number, y: number, z: number) => x + y * n + z * n * n

  const fits = (x: number, y: number, z: number, s: number[]) => {
    if (x + s[0] > n || y + s[1] > n || z + s[2] > n) return false
    for (let i = x; i < x + s[0]; i++)
      for (let j = y; j < y + s[1]; j++)
        for (let k = z; k < z + s[2]; k++) if (occupied[at(i, j, k)]) return false
    return true
  }

  const pick = () => {
    const r = rnd()
    return r < 0.3 ? 1 : r < 0.84 ? 2 : 3
  }

  const raw: { cell: number[]; s: number[] }[] = []
  for (let y = 0; y < n; y++)
    for (let z = 0; z < n; z++)
      for (let x = 0; x < n; x++) {
        if (occupied[at(x, y, z)]) continue
        const s = [pick(), pick(), pick()]
        while (!fits(x, y, z, s)) {
          const k = s.indexOf(Math.max(...s))
          if (s[k] === 1) break
          s[k]--
        }
        for (let i = x; i < x + s[0]; i++)
          for (let j = y; j < y + s[1]; j++)
            for (let k = z; k < z + s[2]; k++) occupied[at(i, j, k)] = 1
        raw.push({ cell: [x, y, z], s })
      }

  const half = (n * unit) / 2
  const blocks: BlockDef[] = raw.map(({ cell, s }, index) => {
    const home = new Vector3(
      (cell[0] + s[0] / 2) * unit - half,
      (cell[1] + s[1] / 2) * unit - half,
      (cell[2] + s[2] / 2) * unit - half,
    )
    const dir = home.clone().add(new Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(0.3))
    if (dir.lengthSq() < 1e-4) dir.set(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5)
    dir.normalize()
    return {
      index,
      size: [s[0] * unit - gap, s[1] * unit - gap, s[2] * unit - gap],
      home,
      mat: 'obsidian',
      order: 0,
      dir,
      axis: new Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize(),
      phase: rnd() * Math.PI * 2,
      twist: rnd() * 2 - 1,
      introFrom: dir
        .clone()
        .multiplyScalar(7 + rnd() * 6)
        .add(new Vector3((rnd() - 0.5) * 6, (rnd() - 0.5) * 6, (rnd() - 0.5) * 4 + 3)),
      introDelay: rnd(),
      ringAngle: 0,
    }
  })

  // Orden de construcción: de abajo hacia arriba.
  const ys = blocks.map((b) => b.home.y - b.size[1] / 2)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  blocks.forEach((b, i) => {
    b.order = Math.min(1, Math.max(0, (ys[i] - minY) / (maxY - minY || 1)) * 0.85 + rnd() * 0.15)
  })

  // Distribución en anillo, intercalando tamaños.
  const shuffled = [...blocks].sort((a, b) => a.phase - b.phase)
  shuffled.forEach((b, i) => {
    b.ringAngle = (i / shuffled.length) * Math.PI * 2
  })

  assignMaterials(blocks, rnd, half)
  return blocks
}

function assignMaterials(blocks: BlockDef[], rnd: () => number, half: number) {
  const volume = (b: BlockDef) => b.size[0] * b.size[1] * b.size[2]
  const isOuter = (b: BlockDef) =>
    b.home.x + b.size[0] / 2 > half - 0.1 ||
    b.home.y + b.size[1] / 2 > half - 0.1 ||
    b.home.z + b.size[2] / 2 > half - 0.1
  const facing = (b: BlockDef) => b.home.x * 0.8 + b.home.y + b.home.z * 1.2

  const taken = new Set<BlockDef>()

  // Núcleo violeta: dos bloques pequeños y visibles, alejados entre sí (el "núcleo" de la marca).
  const small = blocks.filter((b) => volume(b) <= 0.3 && isOuter(b)).sort((a, b) => facing(b) - facing(a))
  const first = small[0] ?? blocks[0]
  first.mat = 'core'
  taken.add(first)
  const second = small
    .filter((b) => b !== first)
    .sort((a, b) => b.home.distanceTo(first.home) - a.home.distanceTo(first.home))[0]
  if (second) {
    second.mat = 'core'
    taken.add(second)
  }

  // Cristal: bloques medianos en el exterior.
  const glassPool = blocks
    .filter((b) => !taken.has(b) && isOuter(b) && volume(b) > 0.2 && volume(b) < 1.4)
    .sort(() => rnd() - 0.5)
  glassPool.slice(0, 4).forEach((b) => {
    b.mat = 'glass'
    taken.add(b)
  })

  for (const b of blocks) {
    if (taken.has(b)) continue
    const r = rnd()
    b.mat = r < 0.5 ? 'obsidian' : r < 0.82 ? 'titanium' : 'bone'
  }
}
