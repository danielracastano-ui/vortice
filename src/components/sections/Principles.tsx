import { useRef } from 'react'
import { principles } from '../../content/principles'
import { useReveal } from '../../hooks/useReveal'
import { pad2 } from '../../lib/math'
import './Principles.css'

export function Principles() {
  const root = useRef<HTMLElement>(null)
  useReveal(root)

  return (
    <section
      id="enfoque"
      data-stage="principles"
      className="section principles"
      ref={root}
      aria-labelledby="enfoque-title"
    >
      <div className="container">
        <header className="principles__head">
          <p className="section-label mono" data-reveal>
            <b>05</b> Enfoque
          </p>
          <h2 id="enfoque-title" className="h2" data-split>
            Nuestra manera de trabajar
          </h2>
        </header>

        <ol className="principles__grid" data-reveal-group>
          {principles.map((principle, i) => (
            <li key={principle.title} className="principle">
              <span className="principle__number mono" aria-hidden="true">
                {pad2(i + 1)}
              </span>
              <h3 className="principle__title">{principle.title}</h3>
              <p>{principle.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
