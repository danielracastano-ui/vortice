/**
 * Aviso por WhatsApp de cada mensaje del formulario de contacto.
 *
 * Netlify ejecuta automáticamente la función llamada `submission-created`
 * cada vez que Netlify Forms acepta un envío. El mensaje ya está guardado en
 * el panel de Netlify cuando esto corre: si el aviso falla, no se pierde nada.
 *
 * El número de destino NO está en el sitio ni en este archivo. Se lee de las
 * variables de entorno de Netlify (Site configuration → Environment variables):
 *
 *   WHATSAPP_PHONE    Número que recibe los avisos, con código de país. Ej.: +5215512345678
 *   WHATSAPP_APIKEY   Clave del servicio de envío (CallMeBot).
 *
 * Cada ejecución deja una línea en el registro de la función (Logs → Functions
 * en Netlify) que dice qué ocurrió, sin incluir datos del visitante.
 */

const FORM_NAME = 'contacto'
const MAX_MESSAGE = 900

/** Proveedores de envío. Para usar otro servicio, añade aquí su función. */
const providers = {
  /** CallMeBot: envía un WhatsApp al número que previamente autorizó al servicio. */
  async callmebot(text, env) {
    const phone = `+${String(env.WHATSAPP_PHONE).replace(/[^\d]/g, '')}`
    const query = new URLSearchParams({ phone, text, apikey: String(env.WHATSAPP_APIKEY).trim() })
    const response = await fetch(`https://api.callmebot.com/whatsapp.php?${query}`, {
      signal: AbortSignal.timeout(8000),
    })
    const detail = (await response.text().catch(() => '')).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    if (!response.ok) throw new Error(`CallMeBot respondió ${response.status}: ${detail.slice(0, 200)}`)
    return detail.slice(0, 200)
  },
}

/** Compone el texto del aviso a partir de los campos del formulario. */
export function buildMessage(data) {
  const clean = (value) => String(value ?? '').trim()
  let message = clean(data.message)
  if (message.length > MAX_MESSAGE) {
    message = `${message.slice(0, MAX_MESSAGE)}… (mensaje completo en el panel de Netlify)`
  }
  const lines = [
    '*Nuevo mensaje desde la web*',
    `*Nombre:* ${clean(data.name)}`,
    `*Correo:* ${clean(data.email)}`,
  ]
  if (clean(data.company)) lines.push(`*Empresa:* ${clean(data.company)}`)
  if (clean(data.services)) lines.push(`*Necesita:* ${clean(data.services)}`)
  lines.push('', message)
  return lines.join('\n')
}

/** Extrae el envío del formulario del evento que entrega Netlify. */
function readPayload(event) {
  const raw = event?.isBase64Encoded ? Buffer.from(event.body ?? '', 'base64').toString('utf8') : event?.body
  return JSON.parse(raw || '{}').payload
}

/**
 * Lógica del aviso, separada del punto de entrada para poder probarla con una
 * configuración explícita. Devuelve la respuesta HTTP de la función.
 */
export async function notify(event, env) {
  let payload
  try {
    payload = readPayload(event)
  } catch {
    console.error('Aviso por WhatsApp: el evento recibido no es JSON válido.')
    return { statusCode: 400, body: 'Cuerpo no válido' }
  }

  // Solo interesa el formulario de contacto.
  const formName = payload?.form_name ?? payload?.data?.['form-name']
  if (!payload || (formName && formName !== FORM_NAME)) {
    console.log(`Aviso por WhatsApp: envío ignorado (formulario "${formName ?? 'desconocido'}").`)
    return { statusCode: 200, body: 'Ignorado' }
  }

  const missing = ['WHATSAPP_PHONE', 'WHATSAPP_APIKEY'].filter((name) => !String(env[name] ?? '').trim())
  if (missing.length > 0) {
    console.error(`Aviso por WhatsApp sin configurar: falta ${missing.join(' y ')} en las variables de entorno.`)
    return { statusCode: 200, body: 'Sin configurar' }
  }

  try {
    const reply = await providers.callmebot(buildMessage(payload.data ?? {}), env)
    console.log(`Aviso por WhatsApp enviado. Respuesta del servicio: ${reply || '(vacía)'}`)
    return { statusCode: 200, body: 'Aviso enviado' }
  } catch (error) {
    // El envío sigue guardado en Netlify; el fallo queda en el registro de la función.
    console.error('No se pudo enviar el aviso por WhatsApp:', error?.message ?? error)
    return { statusCode: 502, body: 'Fallo al enviar el aviso' }
  }
}

/**
 * Punto de entrada que invoca Netlify. Solo usa el primer argumento: la
 * plataforma puede pasar otros (contexto, callback) que no deben confundirse
 * con la configuración.
 */
export async function handler(event) {
  return notify(event, process.env)
}
