import { site } from '../config/site'
import { services } from '../content/services'

export interface ContactPayload {
  name: string
  email: string
  company: string
  services: string[]
  message: string
}

export type ContactErrors = Partial<Record<'name' | 'email' | 'message' | 'consent', string>>

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function validateContact(values: ContactPayload, consent: boolean): ContactErrors {
  const errors: ContactErrors = {}
  if (values.name.trim().length < 2) errors.name = 'Escribe tu nombre.'
  if (!values.email.trim()) errors.email = 'Escribe tu correo electrónico.'
  else if (!EMAIL.test(values.email.trim())) errors.email = 'Revisa el formato del correo (nombre@dominio.com).'
  if (values.message.trim().length < 10) errors.message = 'Cuéntanos un poco más (al menos 10 caracteres).'
  if (!consent) errors.consent = 'Necesitamos tu aceptación para poder responderte.'
  return errors
}

/** Tiempo máximo de espera de la respuesta del servidor. */
const SUBMIT_TIMEOUT_MS = 30000

/**
 * Por qué falló un envío:
 *  - offline:  no hubo respuesta (sin conexión, o la petición fue bloqueada).
 *  - timeout:  el servidor tardó más de lo razonable.
 *  - rejected: el servidor respondió con un error; `status` es el código HTTP.
 */
export type ContactFailure = 'offline' | 'timeout' | 'rejected'

export class ContactError extends Error {
  readonly kind: ContactFailure
  readonly status?: number

  constructor(kind: ContactFailure, status?: number, cause?: unknown) {
    super(status ? `Envío rechazado (HTTP ${status})` : `Envío fallido (${kind})`, { cause })
    this.name = 'ContactError'
    this.kind = kind
    this.status = status
  }
}

/** Nombre del formulario en Netlify Forms. Debe coincidir con el <form> de public/__forms.html. */
export const NETLIFY_FORM_NAME = 'contacto'

/** Archivo estático donde Netlify registra el formulario y al que se envían los datos. */
const NETLIFY_FORM_PATH = '/__forms.html'

/**
 * Envía el formulario de contacto.
 *
 * - Por defecto (producción en Netlify) usa Netlify Forms: Netlify guarda el
 *   mensaje y dispara la función `submission-created`, que avisa por WhatsApp.
 * - Si se define VITE_CONTACT_ENDPOINT, envía JSON a ese endpoint (API propia
 *   u otro servicio). Así funciona el endpoint simulado de desarrollo.
 */
export async function submitContact(values: ContactPayload): Promise<void> {
  const fields = {
    name: values.name.trim(),
    email: values.email.trim(),
    company: values.company.trim(),
    message: values.message.trim(),
    page: window.location.href,
  }
  const endpoint = site.contact.formEndpoint

  const request: RequestInit = endpoint
    ? {
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...fields, services: values.services, consent: true }),
      }
    : {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          'form-name': NETLIFY_FORM_NAME,
          ...fields,
          // Nombres legibles: es lo que se lee en el aviso y en el panel de Netlify.
          services: values.services
            .map((id) => services.find((service) => service.id === id)?.name ?? id)
            .join(', '),
          consent: 'sí',
        }).toString(),
      }

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), SUBMIT_TIMEOUT_MS)
  let response: Response
  try {
    response = await fetch(endpoint || NETLIFY_FORM_PATH, { method: 'POST', ...request, signal: controller.signal })
  } catch (cause) {
    // fetch solo lanza si se agotó el tiempo o si no hubo respuesta del servidor.
    throw new ContactError(controller.signal.aborted ? 'timeout' : 'offline', undefined, cause)
  } finally {
    window.clearTimeout(timeout)
  }
  if (!response.ok) throw new ContactError('rejected', response.status)
}
