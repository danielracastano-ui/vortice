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
 */

const FORM_NAME = 'contacto'
const MAX_MESSAGE = 900

/** Proveedores de envío. Para usar otro servicio, añade aquí su función. */
const providers = {
  /** CallMeBot: envía un WhatsApp al número que previamente autorizó al servicio. */
  async callmebot(text, env) {
    const phone = `+${String(env.WHATSAPP_PHONE).replace(/[^\d]/g, '')}`
    const query = new URLSearchParams({ phone, text, apikey: env.WHATSAPP_APIKEY })
    const response = await fetch(`https://api.callmebot.com/whatsapp.php?${query}`, {
      signal: AbortSignal.timeout(8000),
    })
    if (!response.ok) {
      const detail = (await response.text().catch(() => '')).slice(0, 200)
      throw new Error(`CallMeBot respondió ${response.status}: ${detail}`)
    }
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

export async function handler(event, _context, env = process.env) {
  let payload
  try {
    payload = JSON.parse(event.body ?? '{}').payload
  } catch {
    return { statusCode: 400, body: 'Cuerpo no válido' }
  }

  // Solo interesa el formulario de contacto.
  if (!payload || payload.form_name !== FORM_NAME) return { statusCode: 200, body: 'Ignorado' }

  if (!env.WHATSAPP_PHONE || !env.WHATSAPP_APIKEY) {
    console.warn('Aviso por WhatsApp sin configurar: faltan WHATSAPP_PHONE o WHATSAPP_APIKEY.')
    return { statusCode: 200, body: 'Sin configurar' }
  }

  try {
    await providers.callmebot(buildMessage(payload.data ?? {}), env)
    return { statusCode: 200, body: 'Aviso enviado' }
  } catch (error) {
    // El envío sigue guardado en Netlify; el fallo queda en el registro de la función.
    console.error('No se pudo enviar el aviso por WhatsApp:', error)
    return { statusCode: 502, body: 'Fallo al enviar el aviso' }
  }
}
