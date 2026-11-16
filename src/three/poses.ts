/**
 * Coreografía de la pieza central ("el constructo") a lo largo de la página.
 *
 * Cada sección declara una pose de entrada y otra de salida; el Director
 * interpola entre ellas según el scroll. x/y están en fracciones de la mitad
 * del viewport (1 = borde), de modo que la composición es responsiva.
 */
export interface Pose {
  x: number
  y: number
  scale: number
  rx: number
  ry: number
  /** Velocidad de giro en reposo (rad/s). */
  spin: number
  /** 0 = ensamblado, 1 = vista explosionada. */
  explode: number
  /** 1 = los bloques orbitan en anillo. */
  ring: number
  /** 1 = los bloques se dispersan y desaparecen. */
  scatter: number
  /** Etapa de construcción (0…5): partículas → trazos → volumen → verificación → terminado. */
  build: number
  glow: number
  camZ: number
  exposure: number
  /**
   * 1 = la pieza se desplaza con el contenido de su sección (como un elemento
   * más de la página) en lugar de quedar fija en pantalla. No se interpola
   * como el resto: lo resuelve el Director a partir del scroll.
   */
  follow: number
  /**
   * Fracción (0–1) del recorrido hacia la sección siguiente durante la cual la
   * pieza conserva esta pose. Sirve para que salga de pantalla con su contenido
   * antes de transformarse, en lugar de cruzarse con él.
   */
  hold: number
}

export type SectionKey = 'hero' | 'about' | 'services' | 'process' | 'work' | 'principles' | 'cta'

export const POSE_KEYS: (keyof Pose)[] = [
  'x', 'y', 'scale', 'rx', 'ry', 'spin', 'explode', 'ring', 'scatter', 'build', 'glow', 'camZ', 'exposure',
]

const base: Pose = {
  x: 0, y: 0, scale: 1, rx: 0.48, ry: 0.72, spin: 0.1,
  explode: 0, ring: 0, scatter: 0, build: 5, glow: 0.6, camZ: 10, exposure: 1, follow: 0, hold: 0,
}

const pose = (p: Partial<Pose>): Pose => ({ ...base, ...p })

type PoseSet = Record<SectionKey, { in: Pose; out: Pose }>

export const desktopPoses: PoseSet = {
  hero: {
    in: pose({ x: 0.5, y: 0.2, scale: 1.0, explode: 0.05, glow: 0.8 }),
    out: pose({ x: 0.5, y: 0.2, scale: 1.0, explode: 0.05, glow: 0.8 }),
  },
  about: {
    in: pose({ x: -0.56, y: 0, scale: 0.62, explode: 1, spin: 0.07, ry: 0.4, glow: 0.5, camZ: 10.5 }),
    out: pose({ x: -0.56, y: 0, scale: 0.62, explode: 1, spin: 0.07, ry: 0.4, glow: 0.5, camZ: 10.5 }),
  },
  services: {
    in: pose({ x: 0.5, y: 0, scale: 0.6, scatter: 1, explode: 1, glow: 0.2, camZ: 10 }),
    out: pose({ x: 0.36, y: 0, scale: 0.9, scatter: 1, build: 0, glow: 0.2, camZ: 10 }),
  },
  process: {
    in: pose({ x: 0.38, y: 0.02, scale: 0.92, build: 0, spin: 0.16, rx: 0.42, glow: 0.3, camZ: 9.6 }),
    out: pose({ x: 0.38, y: 0.1, scale: 0.98, build: 5, spin: 0.16, rx: 0.42, glow: 1.5, camZ: 9.6 }),
  },
  work: {
    in: pose({ x: 0.72, y: 0.46, scale: 0.42, explode: 0.3, spin: 0.14, glow: 0.5, exposure: 0.85, camZ: 10.5, follow: 1, hold: 0.5 }),
    out: pose({ x: 0.72, y: 0.46, scale: 0.42, explode: 0.3, spin: 0.14, glow: 0.5, exposure: 0.85, camZ: 10.5, follow: 1, hold: 0.5 }),
  },
  principles: {
    in: pose({ x: 0, y: -0.06, scale: 0.62, ring: 1, rx: 1.24, ry: 0, spin: 0.05, glow: 0.4, exposure: 0.46, camZ: 11 }),
    out: pose({ x: 0, y: -0.06, scale: 0.62, ring: 1, rx: 1.24, ry: 0, spin: 0.05, glow: 0.4, exposure: 0.46, camZ: 11 }),
  },
  cta: {
    // La posición vertical la fija el hueco `data-construct-anchor` de la sección.
    in: pose({ x: 0, y: -1, scale: 1.35, spin: 0.14, glow: 1.6, rx: 0.56, exposure: 1.05, camZ: 9.4 }),
    out: pose({ x: 0, y: -1, scale: 1.35, spin: 0.14, glow: 1.6, rx: 0.56, exposure: 1.05, camZ: 9.4 }),
  },
}

/** En pantallas estrechas la pieza se centra y se atenúa detrás del texto. */
export const mobilePoses: PoseSet = {
  hero: {
    in: pose({ x: 0.36, y: 0.58, scale: 0.46, explode: 0.05, glow: 0.8 }),
    out: pose({ x: 0.36, y: 0.58, scale: 0.46, explode: 0.05, glow: 0.8 }),
  },
  about: {
    in: pose({ x: 0, y: 0.34, scale: 0.42, explode: 1, spin: 0.07, glow: 0.4, exposure: 0.9, follow: 1 }),
    out: pose({ x: 0, y: 0.34, scale: 0.42, explode: 1, spin: 0.07, glow: 0.4, exposure: 0.9, follow: 1 }),
  },
  services: {
    in: pose({ x: 0, y: 0.3, scale: 0.4, scatter: 1, explode: 1, glow: 0.2 }),
    out: pose({ x: 0, y: 0.3, scale: 0.5, scatter: 1, build: 0, glow: 0.2 }),
  },
  process: {
    in: pose({ x: 0, y: 0.34, scale: 0.56, build: 0, spin: 0.16, rx: 0.42, glow: 0.3 }),
    out: pose({ x: 0, y: 0.38, scale: 0.6, build: 5, spin: 0.16, rx: 0.42, glow: 1.5 }),
  },
  work: {
    in: pose({ x: 0.6, y: 0.72, scale: 0.22, explode: 0.3, spin: 0.14, glow: 0.5, exposure: 0.7, follow: 1, hold: 0.5 }),
    out: pose({ x: 0.6, y: 0.72, scale: 0.22, explode: 0.3, spin: 0.14, glow: 0.5, exposure: 0.7, follow: 1, hold: 0.5 }),
  },
  principles: {
    in: pose({ x: 0, y: 0, scale: 0.6, explode: 1.5, spin: 0.05, glow: 0.3, exposure: 0.34 }),
    out: pose({ x: 0, y: 0, scale: 0.6, explode: 1.5, spin: 0.05, glow: 0.3, exposure: 0.34 }),
  },
  cta: {
    in: pose({ x: 0, y: -1, scale: 0.8, spin: 0.14, glow: 1.6, rx: 0.56, exposure: 1.05 }),
    out: pose({ x: 0, y: -1, scale: 0.8, spin: 0.14, glow: 1.6, rx: 0.56, exposure: 1.05 }),
  },
}

export const initialPose = (): Pose => ({ ...desktopPoses.hero.in })

/**
 * Convierte el progreso lineal del proceso (0…5) en etapas con "mesetas":
 * cada etapa anima durante su tramo y descansa antes de la siguiente.
 */
export function shapeBuild(raw: number): number {
  if (raw >= 4) return 4
  const k = Math.floor(Math.max(0, raw))
  const f = Math.max(0, raw) - k
  const t = Math.min(1, Math.max(0, (f - 0.08) / 0.8))
  return k + t * t * (3 - 2 * t)
}
