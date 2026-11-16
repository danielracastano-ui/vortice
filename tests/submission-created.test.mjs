import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import { buildMessage, handler, notify } from '../netlify/functions/submission-created.mjs'

const env = { WHATSAPP_PHONE: '+52 1 55 1234 5678', WHATSAPP_APIKEY: 'clave-de-prueba' }
const data = {
  name: 'Ana Prueba',
  email: 'ana@example.com',
  company: 'Acme',
  services: 'Sitios web, Automatización',
  message: 'Necesito un sitio & una tienda.\nGracias.',
}
const event = (payload) => ({ body: JSON.stringify({ payload }) })

let calls
const realFetch = globalThis.fetch
const realConsole = { log: console.log, warn: console.warn, error: console.error }

beforeEach(() => {
  calls = []
  globalThis.fetch = async (url) => {
    calls.push(String(url))
    return new Response('Message queued.', { status: 200 })
  }
  console.log = () => {}
  console.warn = () => {}
  console.error = () => {}
})

afterEach(() => {
  globalThis.fetch = realFetch
  Object.assign(console, realConsole)
  delete process.env.WHATSAPP_PHONE
  delete process.env.WHATSAPP_APIKEY
})

test('envía el aviso con el número y la clave de la configuración', async () => {
  const result = await notify(event({ form_name: 'contacto', data }), env)
  assert.equal(result.statusCode, 200)
  assert.equal(result.body, 'Aviso enviado')
  assert.equal(calls.length, 1)

  const url = new URL(calls[0])
  assert.equal(url.origin + url.pathname, 'https://api.callmebot.com/whatsapp.php')
  assert.equal(url.searchParams.get('phone'), '+5215512345678')
  assert.equal(url.searchParams.get('apikey'), 'clave-de-prueba')

  const text = url.searchParams.get('text')
  assert.match(text, /Nuevo mensaje desde la web/)
  assert.match(text, /\*Nombre:\* Ana Prueba/)
  assert.match(text, /\*Correo:\* ana@example\.com/)
  assert.match(text, /\*Necesita:\* Sitios web, Automatización/)
  assert.ok(text.endsWith('Necesito un sitio & una tienda.\nGracias.'), 'conserva símbolos y saltos de línea')
})

// Regresión: la plataforma invoca handler(event, context, callback). El tercer
// argumento NO es la configuración; esta debe leerse siempre de process.env.
test('el punto de entrada lee process.env aunque reciba contexto y callback', async () => {
  process.env.WHATSAPP_PHONE = '+57 300 0000000'
  process.env.WHATSAPP_APIKEY = '  clave-del-entorno  '
  const context = { functionName: 'submission-created' }
  const callback = () => {}

  const result = await handler(event({ form_name: 'contacto', data }), context, callback)

  assert.equal(result.body, 'Aviso enviado')
  assert.equal(calls.length, 1)
  const url = new URL(calls[0])
  assert.equal(url.searchParams.get('phone'), '+573000000000')
  assert.equal(url.searchParams.get('apikey'), 'clave-del-entorno', 'recorta espacios pegados por error')
})

test('el punto de entrada avisa en el registro si faltan las variables', async () => {
  const errors = []
  console.error = (message) => errors.push(String(message))
  const result = await handler(event({ form_name: 'contacto', data }), {}, () => {})
  assert.equal(result.body, 'Sin configurar')
  assert.equal(calls.length, 0)
  assert.match(errors[0], /falta WHATSAPP_PHONE y WHATSAPP_APIKEY/)
})

test('acepta el cuerpo codificado en base64', async () => {
  const body = Buffer.from(JSON.stringify({ payload: { form_name: 'contacto', data } })).toString('base64')
  const result = await notify({ body, isBase64Encoded: true }, env)
  assert.equal(result.body, 'Aviso enviado')
})

test('si el evento no trae nombre de formulario, envía igualmente', async () => {
  const result = await notify(event({ data }), env)
  assert.equal(result.body, 'Aviso enviado')
})

test('ignora envíos de otros formularios', async () => {
  const result = await notify(event({ form_name: 'boletin', data }), env)
  assert.equal(result.body, 'Ignorado')
  assert.equal(calls.length, 0)
})

test('si el servicio falla responde 502 sin lanzar excepción', async () => {
  globalThis.fetch = async () => new Response('APIKey is invalid', { status: 403 })
  const result = await notify(event({ form_name: 'contacto', data }), env)
  assert.equal(result.statusCode, 502)
})

test('un cuerpo que no es JSON devuelve 400', async () => {
  const result = await notify({ body: 'no-json' }, env)
  assert.equal(result.statusCode, 400)
  assert.equal(calls.length, 0)
})

test('el registro no incluye datos del visitante', async () => {
  const lines = []
  console.log = (message) => lines.push(String(message))
  console.error = (message) => lines.push(String(message))
  await notify(event({ form_name: 'contacto', data }), env)
  const output = lines.join('\n')
  assert.ok(output.length > 0)
  for (const secret of ['Ana Prueba', 'ana@example.com', 'clave-de-prueba', '5215512345678']) {
    assert.ok(!output.includes(secret), `el registro no debe contener "${secret}"`)
  }
})

test('omite los campos opcionales vacíos y recorta mensajes muy largos', () => {
  const short = buildMessage({ name: 'Ana', email: 'a@b.co', company: '', services: '', message: 'Hola' })
  assert.equal(short, '*Nuevo mensaje desde la web*\n*Nombre:* Ana\n*Correo:* a@b.co\n\nHola')

  const long = buildMessage({ ...data, message: 'x'.repeat(2000) })
  assert.ok(long.length < 1200)
  assert.match(long, /mensaje completo en el panel de Netlify/)
})
