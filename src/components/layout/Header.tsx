import { useEffect, useState } from 'react'
import { mainNav, site } from '../../config/site'
import { ScrollTrigger } from '../../lib/scroll'
import { useContact } from '../contact/ContactContext'
import { Button } from '../ui/Button'
import { Logo } from '../ui/Logo'
import { MobileMenu } from './MobileMenu'
import './Header.css'

export function Header({ activeId }: { activeId: string }) {
  const { open } = useContact()
  const [hidden, setHidden] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  // La cabecera se retira al bajar y reaparece al subir.
  useEffect(() => {
    const trigger = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        const y = self.scroll()
        setScrolled(y > 40)
        setHidden(self.direction === 1 && y > 320)
      },
    })
    return () => trigger.kill()
  }, [])

  return (
    <>
      <header className="header" data-hidden={hidden && !menuOpen} data-scrolled={scrolled}>
        <div className="container header__inner">
          <a href="#inicio" className="header__logo" aria-label={`${site.name}, ir al inicio`}>
            <Logo />
          </a>

          <nav className="header__nav" aria-label="Principal">
            <ul>
              {mainNav.map((item) => (
                <li key={item.id}>
                  <a href={`#${item.id}`} aria-current={activeId === item.id ? 'true' : undefined}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="header__actions">
            <Button size="sm" className="header__cta" onClick={open}>
              Iniciar proyecto
            </Button>
            <button
              type="button"
              className="header__toggle"
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
            >
              <span className="mono">Menú</span>
              <span className="header__toggle-icon" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>
      <MobileMenu open={menuOpen} activeId={activeId} onClose={() => setMenuOpen(false)} />
    </>
  )
}
