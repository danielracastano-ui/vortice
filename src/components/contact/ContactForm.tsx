import { useId, useRef, useState, type FormEvent } from 'react'
import { site } from '../../config/site'
import { services } from '../../content/services'
import {
  ContactError,
  submitContact,
  validateContact,
  type ContactErrors,
  type ContactPayload,
} from '../../lib/contact'
import { Button } from '../ui/Button'
import { Alert, Check } from '../ui/icons'

type Status = 'idle' | 'submitting' | 'success' | 'error'

const empty: ContactPayload = { name: '', email: '', company: '', services: [], message: '' }
const ERROR_ORDER = ['name', 'email', 'message', 'consent'] as const

/**
 * Explica el fallo al visitante. El código entre paréntesis no le dice nada a
 * él, pero permite saber exactamente qué falló si nos envía una captura.
 */
function failureText(error: ContactError | null): string {
  switch (error?.kind) {
    case 'timeout':
      return 'El envío está tardando demasiado. Inténtalo de nuevo en un momento.'
    case 'offline':
      return 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.'
    case 'invalid':
      return 'Revisa los datos del formulario e inténtalo de nuevo.'
    default:
      return `No pudimos entregar tu mensaje en este momento (${error?.kind ?? 'error'}${
        error?.status ? ` ${error.status}` : ''
      }). Inténtalo de nuevo más tarde.`
  }
}

export function ContactForm({ onDone }: { onDone: () => void }) {
  const id = useId()
  const formRef = useRef<HTMLFormElement>(null)
  const successRef = useRef<HTMLDivElement>(null)
  const [values, setValues] = useState<ContactPayload>(empty)
  const [consent, setConsent] = useState(false)
  const [errors, setErrors] = useState<ContactErrors>({})
  const [status, setStatus] = useState<Status>('idle')
  const [failure, setFailure] = useState<ContactError | null>(null)

  const set = <K extends keyof ContactPayload>(key: K, value: ContactPayload[K]) => {
    setValues((v) => ({ ...v, [key]: value }))
    if (key in errors) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const toggleService = (serviceId: string) =>
    set(
      'services',
      values.services.includes(serviceId)
        ? values.services.filter((s) => s !== serviceId)
        : [...values.services, serviceId],
    )

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (status === 'submitting') return

    const found = validateContact(values, consent)
    setErrors(found)
    const firstInvalid = ERROR_ORDER.find((key) => found[key])
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus()
      return
    }

    setStatus('submitting')
    try {
      await submitContact(values)
      setStatus('success')
      requestAnimationFrame(() => successRef.current?.focus())
    } catch (error) {
      console.error('Fallo al enviar el formulario de contacto:', error)
      setFailure(error instanceof ContactError ? error : null)
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="contact-success" ref={successRef} tabIndex={-1} role="status">
        <span className="contact-success__icon" aria-hidden="true">
          <Check width={22} height={22} />
        </span>
        <h3 className="h3">Mensaje enviado</h3>
        <p className="lead">Gracias, {values.name.trim().split(' ')[0]}. Ya recibimos tu mensaje.</p>
        <div className="contact-success__note">
          <p>
            <strong>Revisa tu correo en los próximos días:</strong> te enviaremos nuestra
            respuesta a <span className="contact-success__email">{values.email.trim()}</span>.
          </p>
          <p>Si no la ves en tu bandeja de entrada, busca también en la carpeta de spam o correo no deseado.</p>
        </div>
        <Button variant="ghost" icon="none" onClick={onDone}>
          Cerrar
        </Button>
      </div>
    )
  }

  const describe = (key: keyof ContactErrors) => (errors[key] ? `${id}-${key}-error` : undefined)
  const fieldError = (key: keyof ContactErrors) =>
    errors[key] && (
      <p className="field__error" id={`${id}-${key}-error`}>
        <Alert width={14} height={14} /> {errors[key]}
      </p>
    )

  return (
    <form ref={formRef} className="contact-form" onSubmit={handleSubmit} noValidate>
      <p className="contact-form__hint mono">* Campos obligatorios</p>

      <div className="field" data-invalid={Boolean(errors.name)}>
        <label htmlFor={`${id}-name`}>Nombre *</label>
        <input
          id={`${id}-name`}
          name="name"
          type="text"
          autoComplete="name"
          required
          value={values.name}
          onChange={(e) => set('name', e.target.value)}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={describe('name')}
        />
        {fieldError('name')}
      </div>

      <div className="field" data-invalid={Boolean(errors.email)}>
        <label htmlFor={`${id}-email`}>Correo electrónico *</label>
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={values.email}
          onChange={(e) => set('email', e.target.value)}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={describe('email')}
        />
        {fieldError('email')}
      </div>

      <div className="field">
        <label htmlFor={`${id}-company`}>Empresa u organización</label>
        <input
          id={`${id}-company`}
          name="company"
          type="text"
          autoComplete="organization"
          value={values.company}
          onChange={(e) => set('company', e.target.value)}
        />
      </div>

      <fieldset className="chips">
        <legend>¿Qué necesitas?</legend>
        <div className="chips__list">
          {services.map((service) => (
            <label key={service.id} className="chip">
              <input
                type="checkbox"
                name="services"
                value={service.id}
                checked={values.services.includes(service.id)}
                onChange={() => toggleService(service.id)}
              />
              <span>{service.name}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="field" data-invalid={Boolean(errors.message)}>
        <label htmlFor={`${id}-message`}>Cuéntanos sobre tu proyecto *</label>
        <textarea
          id={`${id}-message`}
          name="message"
          rows={4}
          required
          value={values.message}
          onChange={(e) => set('message', e.target.value)}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={describe('message')}
        />
        {fieldError('message')}
      </div>

      <div className="consent" data-invalid={Boolean(errors.consent)}>
        <label className="consent__label">
          <input
            type="checkbox"
            name="consent"
            required
            checked={consent}
            onChange={(e) => {
              setConsent(e.target.checked)
              if (errors.consent) setErrors((x) => ({ ...x, consent: undefined }))
            }}
            aria-invalid={Boolean(errors.consent)}
            aria-describedby={describe('consent')}
          />
          <span className="consent__box" aria-hidden="true">
            <Check width={12} height={12} />
          </span>
          <span>
            He leído y acepto el{' '}
            <a href="/privacidad/" target="_blank" rel="noopener">
              aviso de privacidad
            </a>
            . *
          </span>
        </label>
        {fieldError('consent')}
      </div>

      <div className="contact-form__status" role="alert" aria-live="assertive">
        {status === 'error' && (
          <p className="contact-form__failure">
            <Alert width={16} height={16} />
            <span>
              {failureText(failure)}
              {site.contact.email ? (
                <>
                  {' '}
                  También puedes escribirnos a{' '}
                  <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a>.
                </>
              ) : (
                site.socials[0] && (
                  <>
                    {' '}
                    También puedes escribirnos por{' '}
                    <a href={site.socials[0].href} target="_blank" rel="noopener noreferrer">
                      {site.socials[0].label}
                    </a>
                    .
                  </>
                )
              )}
            </span>
          </p>
        )}
      </div>

      <Button type="submit" size="lg" className="contact-form__submit" aria-disabled={status === 'submitting'}>
        {status === 'submitting' ? 'Enviando…' : status === 'error' ? 'Reintentar envío' : 'Enviar mensaje'}
      </Button>
    </form>
  )
}
