import { initialPose, type Pose } from './poses'

/** Valores vivos de la escena, calculados por el Director en cada frame. */
export const rig = {
  /** Pose actual (ya suavizada). */
  live: initialPose() as Pose,
  /** Mitad del ancho/alto visibles en el plano z = 0, en unidades de mundo. */
  hw: 5,
  hh: 3,
  /** Cursor suavizado. */
  px: 0,
  py: 0,
  /** Escala de movimiento autónomo: 0 con "reducir movimiento". */
  motion: 1,
  compact: false,
  /** Factor de tamaño en layout compacto: 1 en teléfonos, mayor en tablets. */
  compactScale: 1,
  /** Desplazamiento vertical (px) de la pieza cuando acompaña al contenido. */
  followPx: 0,
  /** Posición y tamaño actuales de la pieza, y presencia (0–1) de sus anillos orbitales. */
  construct: { x: 0, y: 0, scale: 1, orbit: 0 },
}
