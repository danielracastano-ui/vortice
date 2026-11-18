import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import { buildMessage, handler, isCallmebotSuccess, parseFields, receive } from '../netlify/functions/contacto.mjs'

const env = { WHATSAPP_PHONE: '+57 300 0000000', WHATSAPP_APIKEY: 'clave-de-prueba' }
const fields = {
  name: 'Ana Prueba',
  email: 'ana@example.com',
  company: 'Acme',
  services: ['Sitios web', 'Automatización'],
  message: 'Necesito un sitio & una tienda.\nGracias.',
  page: 'https://vortice.example/',
}
const post = (body) => ({ httpMethod: 'POST', body: JSON.stringify(body) })
const parse = (result) => JSON.parse(result.body)

let calls
const realFetch = globalThis.fetch
const realConsole = { log: console.log, warn: console.warn, error: console.error }

beforeEach(() => {
  calls = []
  globalThis.fetch = async (url) => {
    calls.push(String(url))
    return new Response('Message queued.', { status: 200 })
  }
  console.log = console.warn = console.error = () => {}
})

afterEach(() => {
  globalThis.fetch = realFetch
  Object.assign(console, realConsole)
  delete process.env.WHATSAPP_PHONE
  delete process.env.WHATSAPP_APIKEY
})

test('envía el WhatsApp con los datos del formulario y responde ok', async () => {
  const result = await receive(post(fields), env)
  assert.equal(result.statusCode, 200)
  assert.deepEqual(parse(result), { ok: true })
  assert.equal(calls.length, 1)

  const url = new URL(calls[0])
  assert.equal(url.origin + url.pathname, 'https://api.callmebot.com/whatsapp.php')
  assert.equal(url.searchParams.get('phone'), '+573000000000')
  assert.equal(url.searchParams.get('apikey'), 'clave-de-prueba')
  const text = url.searchParams.get('text')
  assert.match(text, /\*Nombre:\* Ana Prueba/)
  assert.match(text, /\*Correo:\* ana@example\.com/)
  assert.match(text, /\*Necesita:\* Sitios web, Automatización/)
  assert.ok(text.endsWith('Necesito un sitio & una tienda.\nGracias.'))
})

test('el punto de entrada lee process.env aunque Netlify pase más argumentos', async () => {
  process.env.WHATSAPP_PHONE = '+57 318 0000000'
  process.env.WHATSAPP_APIKEY = '  clave-del-entorno  '
  const result = await handler(post(fields), { functionName: 'contacto' }, () => {})
  assert.deepEqual(parse(result), { ok: true })
  assert.equal(new URL(calls[0]).searchParams.get('apikey'), 'clave-del-entorno')
})

test('sin WHATSAPP_PHONE usa el número del código', async () => {
  const result = await receive(post(fields), { WHATSAPP_APIKEY: 'clave-de-prueba' })
  assert.deepEqual(parse(result), { ok: true })
  assert.equal(new URL(calls[0]).searchParams.get('phone'), '+573183639626')
})

test('sin la clave responde not_configured y no llama al servicio', async () => {
  const result = await handler(post(fields))
  assert.equal(result.statusCode, 503)
  assert.deepEqual(parse(result), { ok: false, error: 'not_configured' })
  assert.equal(calls.length, 0)
})

test('si el servicio de WhatsApp falla responde delivery', async () => {
  globalThis.fetch = async () => new Response('APIKey is invalid', { status: 403 })
  const result = await receive(post(fields), env)
  assert.equal(result.statusCode, 502)
  assert.deepEqual(parse(result), { ok: false, error: 'delivery' })
})

test('rechaza datos no válidos sin llamar al servicio', async () => {
  for (const bad of [{ ...fields, email: 'no-es-correo' }, { ...fields, message: 'corto' }, { ...fields, name: '' }]) {
    const result = await receive(post(bad), env)
    assert.equal(result.statusCode, 400)
    assert.deepEqual(parse(result), { ok: false, error: 'invalid' })
  }
  assert.equal((await receive({ httpMethod: 'POST', body: 'no-json' }, env)).statusCode, 400)
  assert.equal(calls.length, 0)
})

test('solo acepta POST', async () => {
  assert.equal((await receive({ httpMethod: 'GET' }, env)).statusCode, 405)
  assert.equal(calls.length, 0)
})

test('descarta en silencio los envíos de bots (campo trampa)', async () => {
  const result = await receive(post({ ...fields, website: 'http://spam.example' }), env)
  assert.deepEqual(parse(result), { ok: true })
  assert.equal(calls.length, 0)
})

test('acepta el cuerpo en base64', async () => {
  const body = Buffer.from(JSON.stringify(fields)).toString('base64')
  const result = await receive({ httpMethod: 'POST', body, isBase64Encoded: true }, env)
  assert.deepEqual(parse(result), { ok: true })
})

test('el registro no incluye datos del visitante ni la configuración', async () => {
  const lines = []
  console.log = console.warn = console.error = (message) => lines.push(String(message))
  await receive(post(fields), env)
  globalThis.fetch = async () => new Response('APIKey is invalid', { status: 403 })
  await receive(post(fields), env)
  const output = lines.join('\n')
  for (const secret of ['Ana Prueba', 'ana@example.com', 'clave-de-prueba', '573000000000']) {
    assert.ok(!output.includes(secret), `el registro no debe contener "${secret}"`)
  }
})

test('recorta campos demasiado largos y mensajes extensos', () => {
  const parsed = parseFields({ ...fields, name: 'x'.repeat(500), message: 'y'.repeat(9000) })
  assert.equal(parsed.name.length, 120)
  assert.equal(parsed.message.length, 4000)
  const text = buildMessage(parsed)
  assert.ok(text.length < 1300)
  assert.match(text, /mensaje recortado/)
  assert.equal(
    buildMessage({ name: 'Ana', email: 'a@b.co', message: 'Hola' }),
    '*Nuevo mensaje desde la web*\n*Nombre:* Ana\n*Correo:* a@b.co\n\nHola',
  )
})

test('una respuesta 200 que no confirma el envío cuenta como fallo', async () => {
  for (const reply of ['APIKey is invalid. Please check it.', 'Error: Phone number not valid', '', '<html><body>Something went wrong</body></html>']) {
    globalThis.fetch = async () => new Response(reply, { status: 200 })
    const result = await receive(post(fields), env)
    assert.equal(result.statusCode, 502, `debería fallar con: ${reply || '(vacía)'}`)
    assert.deepEqual(parse(result), { ok: false, error: 'delivery' })
  }
})

test('reconoce las confirmaciones de CallMeBot', () => {
  assert.ok(isCallmebotSuccess('Message queued. You will receive it in a few seconds.'))
  assert.ok(isCallmebotSuccess('<p><b>Message Sent</b> to +573183639626</p>'))
  assert.ok(!isCallmebotSuccess('Message not sent. Error: APIKey is invalid'))
})
