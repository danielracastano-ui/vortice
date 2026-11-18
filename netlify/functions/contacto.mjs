/**
 * Recibe el formulario de contacto del sitio y lo envía por WhatsApp.
 *
 * El sitio hace POST con JSON a /.netlify/functions/contacto. Netlify publica
 * esta función automáticamente con cada despliegue desde GitHub: no depende de
 * ninguna opción del panel (a diferencia de Netlify Forms).
 *
 * El número de destino está en DEFAULT_PHONE (aquí, en el servidor: no aparece
 * en la página que ven los visitantes). La clave del servicio se lee de las
 * variables de entorno de Netlify (Site configuration → Environment variables):
 *
 *   WHATSAPP_APIKEY   Clave del servicio de envío (CallMeBot). Obligatoria.
 *   WHATSAPP_PHONE    Opcional: si se define, reemplaza a DEFAULT_PHONE.
 *
 * Respuestas (JSON): { ok: true } o { ok: false, error }, donde error es
 *   invalid         los datos no son válidos (400)
 *   not_configured  faltan las variables de entorno (503)
 *   delivery        el servicio de WhatsApp no aceptó el envío (502)
 *
 * Cada ejecución deja una línea en Logs → Functions → contacto, sin datos del visitante.
 */

/** Número que recibe los mensajes del formulario. */
const DEFAULT_PHONE = '+57 318 3639626'

const LIMITS = { name: 120, email: 200, company: 160, services: 300, message: 4000, page: 500 }
const MAX_WHATSAPP_MESSAGE = 900
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const json = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  body: JSON.stringify(body),
})

/**
 * ¿La respuesta de CallMeBot confirma el envío? Solo se acepta si dice que el
 * mensaje quedó en cola o fue enviado y no menciona ningún error.
 */
export function isCallmebotSuccess(reply) {
  const text = String(reply ?? '')
  const confirmed = /\b(queued|sent)\b/i.test(text)
  const failed = /\b(error|invalid|not valid|not allowed|denied|blocked|wrong|fail(ed)?|need to|disabled)\b/i.test(text)
  return confirmed && !failed
}

/** Proveedores de envío. Para usar otro servicio (p. ej. WhatsApp Business), añade aquí su función. */
const providers = {
  /** CallMeBot: envía un WhatsApp al número que previamente autorizó al servicio. */
  async callmebot(text, env) {
    const phone = `+${String(env.WHATSAPP_PHONE).replace(/[^\d]/g, '')}`
    const query = new URLSearchParams({ phone, text, apikey: String(env.WHATSAPP_APIKEY).trim() })
    const response = await fetch(`https://api.callmebot.com/whatsapp.php?${query}`, {
      signal: AbortSignal.timeout(10000),
    })
    const detail = (await response.text().catch(() => '')).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    if (!response.ok) throw new Error(`CallMeBot respondió ${response.status}: ${detail.slice(0, 200)}`)
    // CallMeBot puede responder 200 aunque no envíe nada: el resultado real va en el texto.
    if (!isCallmebotSuccess(detail)) throw new Error(`CallMeBot no confirmó el envío: ${detail.slice(0, 200) || '(respuesta vacía)'}`)
    return detail.slice(0, 200)
  },
}

/** Limpia y valida los campos recibidos. Devuelve null si no son válidos. */
export function parseFields(input) {
  if (!input || typeof input !== 'object') return null
  const text = (key) => String(input[key] ?? '').trim().slice(0, LIMITS[key])
  const services = Array.isArray(input.services) ? input.services.map(String).join(', ') : String(input.services ?? '')
  const fields = {
    name: text('name'),
    email: text('email'),
    company: text('company'),
    services: services.trim().slice(0, LIMITS.services),
    message: text('message'),
    page: text('page'),
  }
  if (fields.name.length < 2 || !EMAIL.test(fields.email) || fields.message.length < 10) return null
  return fields
}

/** Compone el texto del WhatsApp a partir de los campos del formulario. */
export function buildMessage(data) {
  const clean = (value) => String(value ?? '').trim()
  let message = clean(data.message)
  if (message.length > MAX_WHATSAPP_MESSAGE) message = `${message.slice(0, MAX_WHATSAPP_MESSAGE)}… (mensaje recortado)`
  const lines = ['*Nuevo mensaje desde la web*', `*Nombre:* ${clean(data.name)}`, `*Correo:* ${clean(data.email)}`]
  if (clean(data.company)) lines.push(`*Empresa:* ${clean(data.company)}`)
  if (clean(data.services)) lines.push(`*Necesita:* ${clean(data.services)}`)
  lines.push('', message)
  return lines.join('\n')
}

/** Lógica de la función con la configuración explícita (es lo que ejercitan las pruebas). */
export async function receive(event, env) {
  if (event?.httpMethod !== 'POST') return json(405, { ok: false, error: 'method' })

  let input
  try {
    const raw = event.isBase64Encoded ? Buffer.from(event.body ?? '', 'base64').toString('utf8') : event.body
    input = JSON.parse(raw || '{}')
  } catch {
    console.warn('Contacto: el cuerpo no es JSON válido.')
    return json(400, { ok: false, error: 'invalid' })
  }

  // Campo trampa: las personas no lo ven; si viene relleno es un bot. Se responde
  // como si todo hubiera ido bien para no darle pistas.
  if (String(input?.website ?? '').trim()) {
    console.log('Contacto: envío descartado por el campo trampa.')
    return json(200, { ok: true })
  }

  const fields = parseFields(input)
  if (!fields) {
    console.warn('Contacto: datos no válidos.')
    return json(400, { ok: false, error: 'invalid' })
  }

  const config = {
    WHATSAPP_PHONE: String(env.WHATSAPP_PHONE ?? '').trim() || DEFAULT_PHONE,
    WHATSAPP_APIKEY: String(env.WHATSAPP_APIKEY ?? '').trim(),
  }
  if (!config.WHATSAPP_APIKEY) {
    console.error('Contacto sin configurar: falta WHATSAPP_APIKEY en las variables de entorno de Netlify.')
    return json(503, { ok: false, error: 'not_configured' })
  }

  try {
    const reply = await providers.callmebot(buildMessage(fields), config)
    console.log(`Contacto: WhatsApp enviado. Respuesta del servicio: ${reply || '(vacía)'}`)
    return json(200, { ok: true })
  } catch (error) {
    console.error('Contacto: no se pudo enviar el WhatsApp:', error?.message ?? error)
    return json(502, { ok: false, error: 'delivery' })
  }
}

/** Punto de entrada que invoca Netlify. La configuración se lee siempre de process.env. */
export async function handler(event) {
  return receive(event, process.env)
}
