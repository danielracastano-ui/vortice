import { useRef } from 'react'
import { useReveal } from '../../hooks/useReveal'
import './About.css'

const pillars = [
  {
    title: 'Qué hacemos',
    text: 'Sitios web, comercio electrónico, plataformas y automatizaciones. Productos digitales diseñados y programados a la medida de cada negocio.',
  },
  {
    title: 'Cómo pensamos',
    text: 'La tecnología es un medio, no el objetivo. Partimos del problema —no de la herramienta— y elegimos lo que mejor lo resuelve.',
  },
  {
    title: 'Cómo construimos',
    text: 'Diseño e ingeniería avanzan juntos desde el primer día: lo que se diseña se puede construir, y lo que se construye respeta el diseño.',
  },
]

export function About() {
  const root = useRef<HTMLElement>(null)
  useReveal(root)

  return (
    <section id="estudio" data-stage="about" className="section about" ref={root} aria-labelledby="estudio-title">
      <div className="container about__grid">
        <div className="about__figure" aria-hidden="true">
          <p className="mono">
            <span>Fig. 01</span> Vista explosionada
          </p>
          <p className="mono muted">Cada pieza, un propósito</p>
        </div>

        <div className="about__content">
          <p className="section-label mono" data-reveal>
            <b>01</b> Estudio
          </p>
          <h2 id="estudio-title" className="about__statement" data-split>
            Somos un estudio de diseño, desarrollo web y soluciones digitales. Entendemos la
            tecnología como un sistema de piezas bien pensadas: cada una con un propósito, todas
            trabajando juntas.
          </h2>
          <div className="about__pillars" data-reveal-group>
            {pillars.map((pillar) => (
              <article key={pillar.title} className="about__pillar">
                <h3 className="mono">{pillar.title}</h3>
                <p>{pillar.text}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
