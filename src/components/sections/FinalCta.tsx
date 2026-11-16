import { useRef } from 'react'
import { site } from '../../config/site'
import { useReveal } from '../../hooks/useReveal'
import { useContact } from '../contact/ContactContext'
import { Button } from '../ui/Button'
import './FinalCta.css'

export function FinalCta() {
  const root = useRef<HTMLElement>(null)
  const { open } = useContact()
  useReveal(root)

  return (
    <section id="contacto" data-stage="cta" className="cta" ref={root} aria-labelledby="contacto-title">
      <div className="container cta__inner">
        <p className="section-label mono" data-reveal>
          <b>06</b> Contacto
        </p>
        <h2 id="contacto-title" className="cta__title display">
          <span className="visually-hidden">¿Tienes una idea? Construyámosla.</span>
          <span data-split aria-hidden="true">
            ¿Tienes una idea?
          </span>
          <span data-split aria-hidden="true">
            Construyámosla
            <span className="dot" />
          </span>
        </h2>
        <p className="lead cta__text" data-reveal>
          Cuéntanos qué necesitas y en qué punto estás. Te responderemos para conversar sobre los
          siguientes pasos.
        </p>
        <div className="cta__actions" data-reveal data-reveal-delay="0.1">
          <Button size="lg" magnetic onClick={open}>
            Iniciar un proyecto
          </Button>
          {site.contact.email && (
            <a className="link-arrow" href={`mailto:${site.contact.email}`}>
              {site.contact.email}
            </a>
          )}
        </div>
      </div>
      {/* Hueco donde emerge la pieza 3D reensamblada. */}
      <div className="cta__stage" data-construct-anchor aria-hidden="true" />
    </section>
  )
}
