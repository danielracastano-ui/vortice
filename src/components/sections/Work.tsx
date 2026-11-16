import { useEffect, useRef, useState } from 'react'
import { projects as configuredProjects, type Project } from '../../content/projects'
import { useReveal } from '../../hooks/useReveal'
import { pad2 } from '../../lib/math'
import { gsap, ScrollTrigger } from '../../lib/scroll'
import { useContact } from '../contact/ContactContext'
import { Button } from '../ui/Button'
import { ArrowUpRight } from '../ui/icons'
import './Work.css'

/**
 * Portafolio. Se alimenta de `src/content/projects.ts`.
 * Sin proyectos cargados muestra un estado "en preparación": no se inventan trabajos.
 *
 * Solo en desarrollo, `?demo` carga proyectos de muestra para revisar el diseño.
 */
export function Work() {
  const root = useRef<HTMLElement>(null)
  const [projects, setProjects] = useState<Project[]>(configuredProjects)
  useReveal(root)

  useEffect(() => {
    if (!import.meta.env.DEV || !new URLSearchParams(window.location.search).has('demo')) return
    let cancelled = false
    import('../../content/projects.fixture').then((module) => {
      if (!cancelled) setProjects(module.fixtureProjects)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section id="trabajos" data-stage="work" className="section work" ref={root} aria-labelledby="trabajos-title">
      <div className="container">
        <header className="work__head">
          <p className="section-label mono" data-reveal>
            <b>04</b> Trabajos
          </p>
          <h2 id="trabajos-title" className="h2" data-split>
            Trabajos seleccionados
          </h2>
        </header>

        {projects.length > 0 ? (
          <ol className="work__list">
            {projects.map((project, i) => (
              <ProjectCard key={project.id} project={project} index={i} />
            ))}
          </ol>
        ) : (
          <WorkEmpty />
        )}
      </div>
    </section>
  )
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const item = useRef<HTMLLIElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const mock = useRef<HTMLDivElement>(null)
  const flip = index % 2 === 1

  useEffect(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const side = flip ? 1 : -1
      // El mockup llega girado en perspectiva y se endereza al entrar en pantalla.
      const tween = gsap.fromTo(
        stageRef.current,
        { rotationY: 26 * side, rotationX: 9, z: -160, opacity: 0.4 },
        {
          rotationY: 7 * side,
          rotationX: 2,
          z: 0,
          opacity: 1,
          ease: 'none',
          scrollTrigger: { trigger: item.current, start: 'top 92%', end: 'top 30%', scrub: 0.8 },
        },
      )

      // Inclinación con el cursor (solo puntero fino).
      if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        return () => tween.kill()
      }
      const el = mock.current!
      const rx = gsap.quickTo(el, 'rotationX', { duration: 0.8, ease: 'power3.out' })
      const ry = gsap.quickTo(el, 'rotationY', { duration: 0.8, ease: 'power3.out' })
      const move = (event: PointerEvent) => {
        const rect = el.getBoundingClientRect()
        const x = (event.clientX - rect.left) / rect.width - 0.5
        const y = (event.clientY - rect.top) / rect.height - 0.5
        ry(x * 9)
        rx(-y * 7)
        el.style.setProperty('--gx', `${(x + 0.5) * 100}%`)
        el.style.setProperty('--gy', `${(y + 0.5) * 100}%`)
      }
      const leave = () => {
        rx(0)
        ry(0)
      }
      el.addEventListener('pointermove', move)
      el.addEventListener('pointerleave', leave)
      return () => {
        tween.kill()
        el.removeEventListener('pointermove', move)
        el.removeEventListener('pointerleave', leave)
      }
    })
    return () => mm.revert()
  }, [flip])

  const { image } = project

  return (
    <li className="project" data-flip={flip} ref={item}>
      <div className="project__visual">
        <div className="project__stage" ref={stageRef}>
          <div className="project__mock" ref={mock}>
            <div className="project__chrome" aria-hidden="true">
              <i />
              <i />
              <i />
              {project.url && <span className="mono">{hostname(project.url)}</span>}
            </div>
            <img
              src={image.src}
              srcSet={image.srcSet}
              sizes="(min-width: 900px) 58vw, 92vw"
              alt={image.alt}
              width={image.width}
              height={image.height}
              loading="lazy"
              decoding="async"
              onLoad={() => ScrollTrigger.refresh()}
            />
            <span className="project__glare" aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="project__info">
        <p className="mono project__meta">
          <span>{pad2(index + 1)}</span> {project.category}
          {project.year && <> — {project.year}</>}
        </p>
        <h3 className="h3">{project.name}</h3>
        <p className="project__description">{project.description}</p>
        {project.stack && project.stack.length > 0 && (
          <ul className="project__stack" aria-label="Tecnologías utilizadas">
            {project.stack.map((tech) => (
              <li key={tech} className="mono">
                {tech}
              </li>
            ))}
          </ul>
        )}
        {project.url && (
          <a className="link-arrow" href={project.url} target="_blank" rel="noopener noreferrer">
            Visitar proyecto
            <span className="visually-hidden"> {project.name} (se abre en una pestaña nueva)</span>
            <ArrowUpRight />
          </a>
        )}
      </div>
    </li>
  )
}

function WorkEmpty() {
  const { open } = useContact()
  return (
    <div className="work-empty" data-reveal>
      <p className="mono work-empty__status">
        <span aria-hidden="true" /> En preparación
      </p>
      <p className="work-empty__text">
        Estamos documentando nuestros proyectos para presentarlos aquí. Si quieres saber cómo
        abordaríamos el tuyo, conversemos.
      </p>
      <Button variant="ghost" onClick={open}>
        Hablemos de tu proyecto
      </Button>
    </div>
  )
}
