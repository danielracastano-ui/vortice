import { sections } from '../../config/site'
import { pad2 } from '../../lib/math'
import './SectionIndicator.css'

/** Indicador lateral: muestra la sección actual y permite saltar a cualquiera. */
export function SectionIndicator({ activeId }: { activeId: string }) {
  return (
    <nav className="indicator" aria-label="Secciones de la página">
      <ol>
        {sections.map((section, i) => (
          <li key={section.id}>
            <a href={`#${section.id}`} aria-current={activeId === section.id ? 'true' : undefined}>
              <span className="indicator__label mono">
                {pad2(i + 1)} {section.label}
              </span>
              <span className="indicator__tick" aria-hidden="true" />
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
