/**
 * Nivel gráfico de la experiencia:
 *  - high: escena completa (cristal con refracción, más partículas).
 *  - low:  misma identidad con materiales y densidad simplificados (móviles, equipos modestos).
 *  - off:  sin WebGL; se muestra la alternativa visual en CSS.
 *
 * Se puede forzar con `?gfx=high|low|off` para pruebas.
 */
export type GfxTier = 'high' | 'low' | 'off'

const TIERS: readonly GfxTier[] = ['high', 'low', 'off']

interface NavigatorHints {
  deviceMemory?: number
}

export function detectGfx(): GfxTier {
  const forced = new URLSearchParams(window.location.search).get('gfx') as GfxTier | null
  if (forced && TIERS.includes(forced)) return forced

  let renderer = ''
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2')
    if (!gl) return 'off'
    const info = gl.getExtension('WEBGL_debug_renderer_info')
    if (info) renderer = String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL) ?? '')
    gl.getExtension('WEBGL_lose_context')?.loseContext()
  } catch {
    return 'off'
  }

  // Renderizado por software: la escena sería demasiado lenta para ser agradable.
  if (/swiftshader|llvmpipe|software|basic render/i.test(renderer)) return 'off'

  const coarse = window.matchMedia('(pointer: coarse)').matches
  const small = Math.min(window.screen.width, window.screen.height) < 820
  const memory = (navigator as Navigator & NavigatorHints).deviceMemory
  const cores = navigator.hardwareConcurrency

  if ((coarse && small) || (memory !== undefined && memory <= 4) || (cores !== undefined && cores <= 4)) {
    return 'low'
  }
  return 'high'
}

export const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches
