import { useLayoutEffect, type RefObject } from 'react'
import { gsap, SplitText } from '../lib/scroll'

/**
 * Animaciones de aparición al hacer scroll, declaradas en el marcado:
 *
 *  - `data-split`   → el texto entra línea por línea desde una máscara.
 *  - `data-reveal`  → el elemento sube y aparece. `data-reveal-delay="0.2"` lo retrasa.
 *  - `data-reveal-group` → sus hijos directos entran escalonados.
 *
 * Con "reducir movimiento" no se anima nada: el contenido ya es visible.
 */
export function useReveal(scope: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const root = scope.current
    if (!root) return
    const mm = gsap.matchMedia()

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>('[data-split]', root).forEach((el) => {
          SplitText.create(el, {
            type: 'lines',
            mask: 'lines',
            // aria-label solo es válido en encabezados; en el resto el texto se lee tal cual.
            aria: /^H[1-6]$/.test(el.tagName) ? 'auto' : 'none',
            autoSplit: true,
            linesClass: 'split-line',
            onSplit: (self) =>
              gsap.from(self.lines, {
                yPercent: 108,
                duration: 1.25,
                ease: 'expo.out',
                stagger: 0.085,
                scrollTrigger: { trigger: el, start: 'top 86%', once: true },
              }),
          })
        })

        gsap.utils.toArray<HTMLElement>('[data-reveal]', root).forEach((el) => {
          gsap.from(el, {
            y: 36,
            autoAlpha: 0,
            duration: 1.15,
            ease: 'expo.out',
            delay: Number(el.dataset.revealDelay ?? 0),
            scrollTrigger: { trigger: el, start: 'top 90%', once: true },
          })
        })

        gsap.utils.toArray<HTMLElement>('[data-reveal-group]', root).forEach((el) => {
          gsap.from(el.children, {
            y: 44,
            autoAlpha: 0,
            duration: 1.15,
            ease: 'expo.out',
            stagger: 0.09,
            scrollTrigger: { trigger: el, start: 'top 86%', once: true },
          })
        })
      }, root)
      return () => ctx.revert()
    })

    return () => mm.revert()
  }, [scope])
}
