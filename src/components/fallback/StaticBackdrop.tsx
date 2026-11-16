import { useEffect, useRef } from 'react'
import './StaticBackdrop.css'

/**
 * Alternativa visual sin WebGL: el mismo motivo (un cubo de módulos) construido
 * con transformaciones 3D de CSS. Mantiene la identidad con un coste mínimo.
 */
export function StaticBackdrop() {
  const root = useRef<HTMLDivElement>(null)

  // Pasado el hero, la pieza se atenúa para no competir con el contenido.
  useEffect(() => {
    const update = () => {
      const away = Math.min(1, window.scrollY / (window.innerHeight * 0.8))
      root.current?.style.setProperty('--away', away.toFixed(3))
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  return (
    <div className="static-backdrop" ref={root} aria-hidden="true">
      <div className="static-backdrop__glow" />
      <div className="css-construct">
        {['a', 'b', 'c', 'd', 'e'].map((id) => (
          <div key={id} className={`css-cube css-cube--${id}`}>
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
        ))}
      </div>
    </div>
  )
}
