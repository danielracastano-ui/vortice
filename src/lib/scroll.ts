import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger, SplitText)

let lenis: Lenis | null = null
let lockCount = 0

/** Inicia el scroll suave (Lenis) sincronizado con GSAP. Devuelve la función de limpieza. */
export function initSmoothScroll(): () => void {
  lenis = new Lenis({ lerp: 0.095, wheelMultiplier: 1, touchMultiplier: 1.4 })
  lenis.on('scroll', ScrollTrigger.update)
  const tick = (time: number) => lenis?.raf(time * 1000)
  gsap.ticker.add(tick)
  gsap.ticker.lagSmoothing(0)
  if (lockCount > 0) lenis.stop()

  return () => {
    gsap.ticker.remove(tick)
    lenis?.destroy()
    lenis = null
  }
}

/** Bloquea o libera el scroll de la página (modal, menú móvil, precarga). */
export function lockScroll(lock: boolean) {
  lockCount = Math.max(0, lockCount + (lock ? 1 : -1))
  const locked = lockCount > 0
  document.documentElement.classList.toggle('is-locked', locked)
  if (!lenis) return
  if (locked) lenis.stop()
  else lenis.start()
}

interface ScrollOptions {
  immediate?: boolean
  offset?: number
  /** Mueve el foco al destino al terminar (navegación accesible). */
  focus?: boolean
}

export function scrollToTarget(target: HTMLElement | number, options: ScrollOptions = {}) {
  const { immediate = false, offset = 0, focus = false } = options
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const moveFocus = () => {
    if (!focus || typeof target === 'number') return
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
    target.focus({ preventScroll: true })
  }

  // La posición se calcula con el scroll real del documento (no con el valor
  // interpolado de Lenis), y respeta `scroll-margin-top` del destino.
  const top =
    typeof target === 'number'
      ? target
      : target.getBoundingClientRect().top +
        window.scrollY +
        offset -
        (parseFloat(getComputedStyle(target).scrollMarginTop) || 0)

  if (lenis) {
    lenis.scrollTo(top, {
      immediate: immediate || reduced,
      force: true,
      duration: 1.5,
      easing: (t: number) => 1 - Math.pow(1 - t, 4),
      onComplete: moveFocus,
    })
    return
  }

  window.scrollTo({ top, behavior: immediate || reduced ? 'auto' : 'smooth' })
  moveFocus()
}

/** Desplaza hasta el elemento con el id indicado. Devuelve false si no existe. */
export function scrollToId(id: string, options: ScrollOptions = {}): boolean {
  const el = document.getElementById(id)
  if (!el) return false
  scrollToTarget(el, { focus: true, ...options })
  return true
}

export { gsap, ScrollTrigger, SplitText }
