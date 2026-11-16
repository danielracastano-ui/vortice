import { useEffect, useRef, useState } from 'react'
import { gsap } from '../../lib/scroll'
import { LogoMark } from '../ui/Logo'
import './Preloader.css'

interface PreloaderProps {
  /** Progreso real de carga (0–100). */
  progress: number
  /** Se invoca cuando el contador llega a 100 y la cortina empieza a subir. */
  onExited: () => void
}

/** Estado de carga inicial: contador + barra, y cortina de salida. */
export function Preloader({ progress, onExited }: PreloaderProps) {
  const root = useRef<HTMLDivElement>(null)
  const count = useRef<HTMLSpanElement>(null)
  const bar = useRef<HTMLSpanElement>(null)
  const shown = useRef({ value: 0 })
  const [gone, setGone] = useState(false)
  const exited = useRef(onExited)
  exited.current = onExited

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const tween = gsap.to(shown.current, {
      value: progress,
      duration: reduced ? 0 : progress >= 100 ? 0.7 : 1.1,
      ease: 'power2.out',
      onUpdate: () => {
        const v = Math.round(shown.current.value)
        if (count.current) count.current.textContent = String(v).padStart(3, '0')
        if (bar.current) bar.current.style.transform = `scaleX(${shown.current.value / 100})`
      },
      onComplete: () => {
        if (progress < 100) return
        // La entrada de la página arranca a la vez que sube la cortina.
        exited.current()
        if (reduced) return setGone(true)
        gsap.to(root.current, {
          yPercent: -100,
          duration: 1.05,
          ease: 'expo.inOut',
          delay: 0.1,
          onComplete: () => setGone(true),
        })
      },
    })
    return () => {
      tween.kill()
    }
  }, [progress])

  if (gone) return null

  return (
    <div className="preloader" ref={root} role="status" aria-label="Cargando el sitio">
      <div className="preloader__mark">
        <LogoMark size={72} spinning />
      </div>
      <div className="preloader__foot">
        <span className="mono muted">Cargando experiencia</span>
        <span className="preloader__count" ref={count} aria-hidden="true">
          000
        </span>
      </div>
      <span className="preloader__bar" aria-hidden="true">
        <span ref={bar} />
      </span>
    </div>
  )
}
