import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

/**
 * Función de contacto simulada, solo en `vite dev`, en la misma ruta que en
 * Netlify. Valida con el mismo código que la función real pero no envía nada.
 */
function devContactFunction(): Plugin {
  return {
    name: 'dev-contact-function',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/.netlify/functions/contacto', (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end(JSON.stringify({ ok: false, error: 'method' }))
          return
        }
        let body = ''
        req.on('data', (chunk) => (body += chunk))
        req.on('end', async () => {
          const { parseFields } = await import('./netlify/functions/contacto.mjs')
          let fields = null
          try {
            fields = parseFields(JSON.parse(body))
          } catch {
            fields = null
          }
          if (!fields) {
            res.statusCode = 400
            res.end(JSON.stringify({ ok: false, error: 'invalid' }))
            return
          }
          server.config.logger.info(`[contacto:dev] mensaje válido de ${fields.email} (no se envía en desarrollo)`)
          res.end(JSON.stringify({ ok: true }))
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), devContactFunction()],
  build: {
    target: 'es2022',
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        privacidad: resolve(import.meta.dirname, 'privacidad/index.html'),
        terminos: resolve(import.meta.dirname, 'terminos/index.html'),
      },
    },
  },
})
