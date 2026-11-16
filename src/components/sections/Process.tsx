import { useEffect, useRef, useState } from 'react'
import { processSteps } from '../../content/process'
import { useReveal } from '../../hooks/useReveal'
import { clamp, pad2 } from '../../lib/math'
import { ScrollTrigger, scrollToTarget } from '../../lib/scroll'
import './Process.css'

const COUNT = processSteps.length

/**
 * Proceso como narrativa fijada a la pantalla: mientras el usuario avanza,
 * la pieza 3D pasa de nube de partículas a objeto terminado y el texto
 * acompaña cada etapa. Todo el contenido está en el DOM (accesible sin 3D).
 */
export function Process() {
  const root = useRef<HTMLElement>(null)
  const fill = useRef<HTMLSpanElement>(null)
  const [active, setActive] = useState(0)
  useReveal(root)

  useEffect(() => {
    const trigger = ScrollTrigger.create({
      trigger: root.current,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        setActive(clamp(Math.floor(self.progress * COUNT), 0, COUNT - 1))
        if (fill.current) fill.current.style.transform = `scaleX(${self.progress})`
      },
    })
    return () => trigger.kill()
  }, [])

  const goTo = (index: number) => {
    const el = root.current
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY
    const travel = el.offsetHeight - window.innerHeight
    scrollToTarget(top + ((index + 0.5) / COUNT) * travel)
  }

  return (
    <section id="proceso" data-stage="process" className="process" ref={root} aria-labelledby="proceso-title">
      <div className="process__pin">
        <div className="container process__inner">
          <header className="process__head">
            <p className="section-label mono" data-reveal>
              <b>03</b> Proceso
            </p>
            <h2 id="proceso-title" className="h2" data-split>
              De la idea al lanzamiento
            </h2>
          </header>

          <ol className="process__steps">
            {processSteps.map((step, i) => (
              <li
                key={step.id}
                className="process-step"
                data-state={i === active ? 'active' : i < active ? 'past' : 'next'}
              >
                <p className="process-step__number" aria-hidden="true">
                  {pad2(i + 1)}
                </p>
                <h3 className="h3">{step.title}</h3>
                <p className="process-step__text">{step.description}</p>
                <p className="process-step__state mono" aria-hidden="true">
                  {step.state}
                </p>
              </li>
            ))}
          </ol>

          <div className="process__rail">
            <span className="process__track" aria-hidden="true">
              <span ref={fill} />
            </span>
            <ul>
              {processSteps.map((step, i) => (
                <li key={step.id}>
                  <button
                    type="button"
                    className="mono"
                    aria-current={i === active ? 'step' : undefined}
                    data-done={i < active}
                    aria-label={`Etapa ${i + 1}: ${step.title}`}
                    onClick={() => goTo(i)}
                  >
                    <span>{pad2(i + 1)}</span>
                    <span className="process__rail-name">{step.short}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
