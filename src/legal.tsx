import '@fontsource-variable/bricolage-grotesque/wdth.css'
import '@fontsource-variable/geist-mono/index.css'
import '@fontsource/montserrat/latin-700.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ContactProvider } from './components/contact/ContactContext'
import { Footer } from './components/layout/Footer'
import { ArrowRight } from './components/ui/icons'
import { Logo } from './components/ui/Logo'
import { site } from './config/site'
import { legalDocs } from './content/legal'
import './styles/tokens.css'
import './styles/base.css'
import './legal.css'

const root = document.getElementById('root')!
const doc = legalDocs[root.dataset.doc === 'terminos' ? 'terminos' : 'privacidad']
const updated = new Intl.DateTimeFormat('es', { dateStyle: 'long', timeZone: 'UTC' }).format(
  new Date(`${site.legal.updatedAt}T00:00:00Z`),
)

/** Páginas legales: documento estático y ligero, sin escena 3D. */
function LegalPage() {
  return (
    <ContactProvider>
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>
      <header className="legal-header">
        <div className="container legal-header__inner">
          <a href="/" aria-label={`${site.name}, ir al inicio`}>
            <Logo />
          </a>
          <a href="/" className="link-arrow">
            Volver al sitio <ArrowRight />
          </a>
        </div>
      </header>

      <main id="contenido" className="container legal">
        <p className="section-label mono">Legal</p>
        <h1 className="h2">
          {doc.title}
          <span className="dot" aria-hidden="true" />
        </h1>
        <p className="mono muted">Última actualización: {updated}</p>
        <p className="lead legal__intro">{doc.intro}</p>

        {doc.sections.map((section, i) => (
          <section key={section.heading} className="legal__section">
            <h2>
              <span className="mono" aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              {section.heading}
            </h2>
            <div>
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </main>
      <Footer />
    </ContactProvider>
  )
}

createRoot(root).render(
  <StrictMode>
    <LegalPage />
  </StrictMode>,
)
