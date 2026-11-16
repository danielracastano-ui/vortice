import { useEffect, useRef, useState } from 'react'
import { services } from '../../content/services'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { useReveal } from '../../hooks/useReveal'
import { useGfx } from '../../lib/gfx-context'
import { pad2 } from '../../lib/math'
import { ScrollTrigger } from '../../lib/scroll'
import { stage } from '../../lib/stage'
import { ServiceIcon } from '../ui/ServiceIcon'
import './Services.css'

/**
 * Servicios como recorrido espacial: la lista avanza con el scroll y, a su
 * lado, un emblema 3D por servicio entra en escena. En pantallas estrechas
 * cada servicio lleva su propio emblema.
 */
export function Services() {
  const root = useRef<HTMLElement>(null)
  const sharedSlot = useRef<HTMLDivElement>(null)
  const ownSlots = useRef<(HTMLDivElement | null)[]>([])
  const items = useRef<(HTMLLIElement | null)[]>([])
  const [active, setActive] = useState(0)
  const wide = useMediaQuery('(min-width: 900px)')
  const gfx = useGfx()
  useReveal(root)

  // Informa a la escena 3D de dónde debe dibujar cada emblema.
  useEffect(() => {
    stage.emblemShared = wide
    stage.emblemSlots = services.map((_, i) => (wide ? sharedSlot.current : ownSlots.current[i]))
    return () => {
      stage.emblemSlots = []
    }
  }, [wide])

  // El servicio activo es el que cruza el centro de la pantalla.
  useEffect(() => {
    const triggers = items.current.flatMap((el, i) =>
      el
        ? ScrollTrigger.create({
            trigger: el,
            start: 'top 52%',
            end: 'bottom 52%',
            onToggle: (self) => {
              if (!self.isActive) return
              stage.activeService = i
              setActive(i)
            },
          })
        : [],
    )
    return () => triggers.forEach((t) => t.kill())
  }, [])

  const current = services[active]

  return (
    <section
      id="servicios"
      data-stage="services"
      className="section services"
      ref={root}
      aria-labelledby="servicios-title"
    >
      <div className="container">
        <header className="services__head">
          <p className="section-label mono" data-reveal>
            <b>02</b> Servicios
          </p>
          <h2 id="servicios-title" className="h2" data-split>
            Lo que construimos
          </h2>
          <p className="lead services__lead" data-reveal>
            Seis maneras de convertir una necesidad de negocio en un producto digital que funciona.
          </p>
        </header>

        <div className="services__body">
          <ol className="services__list">
            {services.map((service, i) => (
              <li
                key={service.id}
                id={`servicio-${service.id}`}
                className="service"
                data-active={i === active}
                ref={(el) => {
                  items.current[i] = el
                }}
                onPointerEnter={(event) => {
                  if (event.pointerType === 'mouse' && i === active) stage.servicePulse++
                }}
              >
                <div
                  className="service__slot"
                  aria-hidden="true"
                  ref={(el) => {
                    ownSlots.current[i] = el
                  }}
                >
                  {gfx === 'off' && <ServiceIcon kind={service.emblem} />}
                </div>
                <p className="service__index mono">
                  <span>{pad2(i + 1)}</span> {service.title}
                </p>
                <h3 className="service__name">{service.name}</h3>
                <p className="service__description">{service.description}</p>
                <p className="service__benefit">
                  <span className="mono">Qué obtienes</span>
                  {service.benefit}
                </p>
              </li>
            ))}
          </ol>

          <div className="services__stage" aria-hidden="true">
            <div className="services__stage-inner">
              <div className="services__slot" ref={sharedSlot}>
                {gfx === 'off' && <ServiceIcon key={current.id} kind={current.emblem} />}
              </div>
              <div className="services__caption mono">
                <p key={current.id} className="services__figure">
                  <span>Fig. {pad2(active + 2)}</span> {current.figure}
                </p>
                <p className="services__counter">
                  <b>{pad2(active + 1)}</b> / {pad2(services.length)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
