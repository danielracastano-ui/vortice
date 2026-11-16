import { mainNav, site } from '../../config/site'
import { services } from '../../content/services'
import { useContact } from '../contact/ContactContext'
import { ArrowUpRight } from '../ui/icons'
import { Logo } from '../ui/Logo'
import './Footer.css'

/**
 * Pie de página. Los datos de contacto y las redes se leen de la configuración:
 * lo que no está definido no se muestra (no se inventan datos ni enlaces).
 */
export function Footer({ home = false }: { home?: boolean }) {
  const { email, phone, whatsapp, location } = site.contact
  const prefix = home ? '' : '/'

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__top">
          <div className="footer__brand">
            <a href={`${prefix}#inicio`} aria-label={`${site.name}, ir al inicio`}>
              <Logo />
            </a>
            <p>{site.description}</p>
          </div>

          <nav className="footer__col" aria-label="Navegación del pie">
            <h2 className="mono">Navegación</h2>
            <ul>
              {mainNav.map((item) => (
                <li key={item.id}>
                  <a href={`${prefix}#${item.id}`}>{item.label}</a>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="footer__col" aria-label="Servicios">
            <h2 className="mono">Servicios</h2>
            <ul>
              {services.map((service) => (
                <li key={service.id}>
                  <a href={`${prefix}#servicio-${service.id}`}>{service.name}</a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="footer__col">
            <h2 className="mono">Contacto</h2>
            <ul>
              {email && (
                <li>
                  <a href={`mailto:${email}`}>{email}</a>
                </li>
              )}
              {phone && (
                <li>
                  <a href={`tel:${phone.replace(/[^\d+]/g, '')}`}>{phone}</a>
                </li>
              )}
              {whatsapp && (
                <li>
                  <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer">
                    WhatsApp <ArrowUpRight width={12} height={12} />
                  </a>
                </li>
              )}
              {location && <li>{location}</li>}
              <li>{home ? <FooterContactButton /> : <a href="/#contacto">Formulario de contacto</a>}</li>
            </ul>

            {site.socials.length > 0 && (
              <>
                <h2 className="mono footer__social-title">Redes</h2>
                <ul>
                  {site.socials.map((social) => (
                    <li key={social.href}>
                      <a href={social.href} target="_blank" rel="noopener noreferrer">
                        {social.label} <ArrowUpRight width={12} height={12} />
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>

        <div className="footer__bottom mono">
          <p>
            © {new Date().getFullYear()} {site.name}. Todos los derechos reservados.
          </p>
          <ul>
            <li>
              <a href="/privacidad/">Aviso de privacidad</a>
            </li>
            <li>
              <a href="/terminos/">Términos y condiciones</a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  )
}

function FooterContactButton() {
  const { open } = useContact()
  return (
    <button type="button" className="footer__link-button" onClick={open}>
      Escríbenos
    </button>
  )
}
