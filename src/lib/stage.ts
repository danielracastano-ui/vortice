import type { GfxTier } from './device'

/**
 * Estado compartido entre el DOM y la escena WebGL.
 *
 * Es un objeto mutable (no estado de React) a propósito: se lee en cada frame
 * y actualizarlo no debe provocar renders.
 */
export const stage = {
  /** Cursor normalizado (-1…1). `active` es falso en dispositivos táctiles. */
  pointer: { x: 0, y: 0, active: false },
  /** Progreso de la animación de entrada (0 → 1). */
  intro: { value: 0 },
  /** Servicio activo (índice) y contador de "pulsos" por hover. */
  activeService: 0,
  servicePulse: 0,
  /**
   * Huecos del DOM a los que se anclan los emblemas 3D de servicios.
   * En escritorio todos comparten un mismo hueco fijo; en móvil cada servicio tiene el suyo.
   */
  emblemSlots: [] as (HTMLElement | null)[],
  emblemShared: true,
  reducedMotion: false,
  tier: 'high' as GfxTier,
}

export type Stage = typeof stage

// Solo en desarrollo: permite inspeccionar y congelar la escena desde la consola o los tests.
if (import.meta.env.DEV) (window as unknown as { __stage: Stage }).__stage = stage
