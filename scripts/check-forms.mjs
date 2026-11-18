/**
 * Comprobación posterior al build: el formulario de Netlify debe existir en
 * dist/__forms.html con todos los campos que envía el sitio. Si falta algo,
 * el build falla aquí en lugar de fallar en producción con un 404.
 */
import { readFileSync } from 'node:fs'

const REQUIRED = ['name', 'email', 'company', 'services', 'message', 'consent', 'page', 'website']
const html = readFileSync(new URL('../dist/__forms.html', import.meta.url), 'utf8')
const form = html.match(/<form[^>]*name="contacto"[^>]*>([\s\S]*?)<\/form>/)

const problems = []
if (!form) problems.push('no hay un <form name="contacto">')
else {
  if (!/data-netlify="true"/.test(form[0])) problems.push('al formulario le falta data-netlify="true"')
  for (const field of REQUIRED) {
    if (!new RegExp(`name="${field}"`).test(form[1])) problems.push(`falta el campo "${field}"`)
  }
}

if (problems.length) {
  console.error(`dist/__forms.html no es válido: ${problems.join('; ')}.`)
  process.exit(1)
}
console.log('Formulario de Netlify comprobado: dist/__forms.html (contacto).')
