import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import { buildMessage, handler } from '../netlify/functions/submission-created.mjs'

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
const realConsole = { warn: console.warn, error: console.error }

beforeEach(() => {
  calls = []
  globalThis.fetch = async (url) => {
    calls.push(String(url))
    return new Response('ok', { status: 200 })
  }
  console.warn = () => {}
  console.error = () => {}
})

afterEach(() => {
  globalThis.fetch = realFetch
  Object.assign(console, realConsole)
})

test('envía el aviso con el número y la clave de las variables de entorno', async () => {
  const result = await handler(event({ form_name: 'contacto', data }), {}, env)
  assert.equal(result.statusCode, 200)
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

test('ignora envíos de otros formularios', async () => {
  const result = await handler(event({ form_name: 'boletin', data }), {}, env)
  assert.equal(result.statusCode, 200)
  assert.equal(calls.length, 0)
})

test('sin variables de entorno no llama al servicio ni falla', async () => {
  const result = await handler(event({ form_name: 'contacto', data }), {}, {})
  assert.equal(result.statusCode, 200)
  assert.equal(calls.length, 0)
})

test('si el servicio falla responde 502 sin lanzar excepción', async () => {
  globalThis.fetch = async () => new Response('APIKey is invalid', { status: 403 })
  const result = await handler(event({ form_name: 'contacto', data }), {}, env)
  assert.equal(result.statusCode, 502)
})

test('un cuerpo que no es JSON devuelve 400', async () => {
  const result = await handler({ body: 'no-json' }, {}, env)
  assert.equal(result.statusCode, 400)
  assert.equal(calls.length, 0)
})

test('omite los campos opcionales vacíos y recorta mensajes muy largos', () => {
  const short = buildMessage({ name: 'Ana', email: 'a@b.co', company: '', services: '', message: 'Hola' })
  assert.equal(short, '*Nuevo mensaje desde la web*\n*Nombre:* Ana\n*Correo:* a@b.co\n\nHola')

  const long = buildMessage({ ...data, message: 'x'.repeat(2000) })
  assert.ok(long.length < 1200)
  assert.match(long, /mensaje completo en el panel de Netlify/)
})
