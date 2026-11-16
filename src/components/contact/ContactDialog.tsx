import { useEffect, useRef, useState } from 'react'
import { lockScroll } from '../../lib/scroll'
import { Close } from '../ui/icons'
import { useContact } from './ContactContext'
import { ContactForm } from './ContactForm'
import './Contact.css'

/**
 * Panel lateral de contacto. Usa <dialog> nativo: foco atrapado, cierre con
 * Escape y devolución del foco al botón que lo abrió, sin librerías.
 */
export function ContactDialog() {
  const { isOpen, close } = useContact()
  const ref = useRef<HTMLDialogElement>(null)
  // Cambiar la clave reinicia el formulario después de un envío correcto.
  const [formKey, setFormKey] = useState(0)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (isOpen && !dialog.open) {
      dialog.showModal()
      lockScroll(true)
    } else if (!isOpen && dialog.open) {
      dialog.close()
    }
  }, [isOpen])

  const handleClose = () => {
    lockScroll(false)
    close()
  }

  return (
    <dialog
      ref={ref}
      className="contact"
      aria-labelledby="contact-title"
      onClose={handleClose}
      onClick={(event) => {
        if (event.target === ref.current) ref.current?.close()
      }}
    >
      <div className="contact__panel" data-lenis-prevent>
        <div className="contact__head">
          <p className="mono section-label">Contacto</p>
          <button type="button" className="contact__close" onClick={() => ref.current?.close()}>
            <span className="mono">Cerrar</span>
            <Close />
          </button>
        </div>
        <h2 id="contact-title" className="contact__title">
          Cuéntanos tu proyecto
          <span className="dot" aria-hidden="true" />
        </h2>
        <p className="contact__intro">
          Describe qué necesitas y en qué punto estás. Con eso podremos responderte con los
          siguientes pasos.
        </p>
        <ContactForm
          key={formKey}
          onDone={() => {
            ref.current?.close()
            setFormKey((k) => k + 1)
          }}
        />
      </div>
    </dialog>
  )
}
