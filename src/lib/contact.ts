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

/** Función de Netlify que recibe el formulario y lo envía por WhatsApp. */
const DEFAULT_ENDPOINT = '/.netlify/functions/contacto'

/**
 * Por qué falló un envío:
 *  - offline:        no hubo respuesta (sin conexión, o la petición fue bloqueada).
 *  - timeout:        el servidor tardó más de lo razonable.
 *  - unavailable:    la función de contacto no existe en el sitio publicado (404).
 *  - not_configured: faltan las variables de entorno en Netlify.
 *  - delivery:       el servicio de WhatsApp no aceptó el envío.
 *  - invalid:        el servidor consideró que los datos no son válidos.
 *  - rejected:       cualquier otro error del servidor; `status` es el código HTTP.
 */
export type ContactFailure =
  | 'offline'
  | 'timeout'
  | 'unavailable'
  | 'not_configured'
  | 'delivery'
  | 'invalid'
  | 'rejected'

export class ContactError extends Error {
  readonly kind: ContactFailure
  readonly status?: number

  constructor(kind: ContactFailure, status?: number, cause?: unknown) {
    super(status ? `Envío fallido: ${kind} (HTTP ${status})` : `Envío fallido: ${kind}`, { cause })
    this.name = 'ContactError'
    this.kind = kind
    this.status = status
  }
}

const SERVER_ERRORS: readonly ContactFailure[] = ['not_configured', 'delivery', 'invalid']

/**
 * Envía el formulario de contacto como JSON a la función de Netlify
 * (o a VITE_CONTACT_ENDPOINT, si está definido).
 */
export async function submitContact(values: ContactPayload): Promise<void> {
  const body = {
    name: values.name.trim(),
    email: values.email.trim(),
    company: values.company.trim(),
    // Nombres legibles: es lo que se lee en el WhatsApp.
    services: values.services.map((id) => services.find((service) => service.id === id)?.name ?? id),
    message: values.message.trim(),
    page: window.location.href,
  }

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), SUBMIT_TIMEOUT_MS)
  let response: Response
  try {
    response = await fetch(site.contact.formEndpoint || DEFAULT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
  } catch (cause) {
    // fetch solo lanza si se agotó el tiempo o si no hubo respuesta del servidor.
    throw new ContactError(controller.signal.aborted ? 'timeout' : 'offline', undefined, cause)
  } finally {
    window.clearTimeout(timeout)
  }

  if (response.ok) return
  if (response.status === 404) throw new ContactError('unavailable', 404)
  const reply = (await response.json().catch(() => null)) as { error?: string } | null
  const kind = SERVER_ERRORS.find((error) => error === reply?.error) ?? 'rejected'
  throw new ContactError(kind, response.status)
}
