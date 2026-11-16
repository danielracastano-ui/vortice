import { useLayoutEffect, useRef } from 'react'
import type { Phase } from '../../lib/gfx-context'
import { gsap, SplitText } from '../../lib/scroll'
import { useContact } from '../contact/ContactContext'
import { Button } from '../ui/Button'
import { ArrowDown } from '../ui/icons'
import './Hero.css'

export function Hero({ phase }: { phase: Phase }) {
  const root = useRef<HTMLElement>(null)
  const { open } = useContact()
  const started = phase !== 'loading'

  // Entrada: sincronizada con el ensamblaje de la pieza 3D.
  useLayoutEffect(() => {
    if (!started) return
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        const split = SplitText.create('.hero__line-text', { type: 'chars', aria: 'none' })
        gsap
          .timeline({ defaults: { ease: 'expo.out' }, delay: 0.45 })
          .from(split.chars, { yPercent: 118, duration: 1.5, stagger: 0.024 })
          .from('.hero__title .dot', { scale: 0, duration: 0.9 }, '-=0.9')
          .from('.hero__eyebrow', { autoAlpha: 0, y: 16, duration: 1.1 }, 0.15)
          .from('.hero__sub', { autoAlpha: 0, y: 28, duration: 1.3 }, 0.8)
          .from('.hero__cta', { autoAlpha: 0, y: 24, duration: 1.2, stagger: 0.1 }, 0.95)
          .from('.hero__meta > *', { autoAlpha: 0, duration: 1.4, stagger: 0.12 }, 1.3)
      }, root)
      return () => ctx.revert()
    })
    return () => mm.revert()
  }, [started])

  return (
    <section id="inicio" data-stage="hero" className="hero" ref={root} aria-labelledby="hero-title">
      <div className="container hero__inner">
        <p className="hero__eyebrow section-label mono">Estudio de diseño y desarrollo web</p>

        <h1 id="hero-title" className="hero__title display">
          <span className="visually-hidden">Lo digital, bien construido.</span>
          <span className="hero__line" aria-hidden="true">
            <span className="hero__line-text">Lo digital,</span>
          </span>
          <span className="hero__line" aria-hidden="true">
            <span className="hero__line-text">bien construido</span>
            <span className="dot" />
          </span>
        </h1>

        <div className="hero__foot">
          <p className="hero__sub lead">
            Diseñamos y desarrollamos sitios web, tiendas en línea, plataformas y automatizaciones a
            la medida de tu negocio. Estrategia, diseño e ingeniería como una sola pieza.
          </p>
          <div className="hero__ctas">
            <div className="hero__cta">
              <Button magnetic onClick={open}>
                Iniciar un proyecto
              </Button>
            </div>
            <div className="hero__cta">
              <Button variant="ghost" href="#trabajos">
                Explorar trabajos
              </Button>
            </div>
          </div>
        </div>

        <div className="hero__meta mono">
          <a href="#estudio" className="hero__scroll">
            <span className="hero__scroll-icon" aria-hidden="true">
              <ArrowDown />
            </span>
            Desplaza para explorar
          </a>
          <span className="muted">Diseño — Desarrollo — Automatización</span>
        </div>
      </div>
    </section>
  )
}
