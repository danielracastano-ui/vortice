import { useEffect, useRef } from 'react'
import { mainNav, site } from '../../config/site'
import { pad2 } from '../../lib/math'
import { lockScroll, scrollToId } from '../../lib/scroll'
import { useContact } from '../contact/ContactContext'
import { Button } from '../ui/Button'
import { Close } from '../ui/icons'
import { Logo } from '../ui/Logo'

interface MobileMenuProps {
  open: boolean
  activeId: string
  onClose: () => void
}

/** Menú a pantalla completa para pantallas estrechas (<dialog> modal). */
export function MobileMenu({ open, activeId, onClose }: MobileMenuProps) {
  const ref = useRef<HTMLDialogElement>(null)
  // Destino elegido en el menú: se navega cuando el diálogo ya se cerró y el scroll está libre.
  const pending = useRef<string | null>(null)
  const contact = useContact()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      lockScroll(true)
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  // Si la ventana crece hasta el layout de escritorio, el menú se cierra solo.
  useEffect(() => {
    const wide = window.matchMedia('(min-width: 960px)')
    const handle = () => wide.matches && ref.current?.close()
    wide.addEventListener('change', handle)
    return () => wide.removeEventListener('change', handle)
  }, [])

  return (
    <dialog
      ref={ref}
      className="menu"
      aria-label="Menú de navegación"
      onClose={() => {
        lockScroll(false)
        onClose()
        const id = pending.current
        pending.current = null
        if (id && scrollToId(id)) window.history.pushState(null, '', `#${id}`)
      }}
    >
      <div className="menu__inner" data-lenis-prevent>
        <div className="menu__head">
          <Logo />
          <button type="button" className="header__toggle" onClick={() => ref.current?.close()}>
            <span className="mono">Cerrar</span>
            <Close />
          </button>
        </div>

        <nav aria-label="Secciones">
          <ul className="menu__list">
            {mainNav.map((item, i) => (
              <li key={item.id} style={{ '--i': i } as React.CSSProperties}>
                <a
                  href={`#${item.id}`}
                  aria-current={activeId === item.id ? 'true' : undefined}
                  onClick={(event) => {
                    event.preventDefault()
                    pending.current = item.id
                    ref.current?.close()
                  }}
                >
                  <span className="mono">{pad2(i + 1)}</span>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="menu__foot">
          <Button
            size="lg"
            onClick={() => {
              ref.current?.close()
              contact.open()
            }}
          >
            Iniciar un proyecto
          </Button>
          <p className="mono muted">{site.tagline}</p>
        </div>
      </div>
    </dialog>
  )
}
