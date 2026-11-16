import { useEffect, type RefObject } from 'react'
import { gsap } from '../lib/scroll'

/**
 * Efecto magnético: el elemento se desplaza unos píxeles hacia el cursor.
 * Solo con puntero fino y sin "reducir movimiento".
 */
export function useMagnetic(ref: RefObject<HTMLElement | null>, enabled = true, strength = 0.28) {
  useEffect(() => {
    const el = ref.current
    if (!el || !enabled) return
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!fine || reduced) return

    const x = gsap.quickTo(el, 'x', { duration: 0.7, ease: 'power3.out' })
    const y = gsap.quickTo(el, 'y', { duration: 0.7, ease: 'power3.out' })

    const move = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      x((event.clientX - (rect.left + rect.width / 2)) * strength)
      y((event.clientY - (rect.top + rect.height / 2)) * strength)
    }
    const leave = () => {
      x(0)
      y(0)
    }

    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    return () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', leave)
      gsap.set(el, { x: 0, y: 0 })
    }
  }, [ref, enabled, strength])
}
