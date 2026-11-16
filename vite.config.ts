import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

/**
 * Endpoint de contacto simulado, solo en `vite dev`.
 * Permite probar el flujo real del formulario (carga, éxito, error) sin backend.
 */
function devContactEndpoint(): Plugin {
  return {
    name: 'dev-contact-endpoint',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/contact', (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end(JSON.stringify({ ok: false }))
          return
        }
        let body = ''
        req.on('data', (chunk) => (body += chunk))
        req.on('end', () => {
          try {
            const data = JSON.parse(body) as Record<string, unknown>
            if (!data.email || !data.message) throw new Error('invalid')
            server.config.logger.info(`[contacto:dev] ${JSON.stringify(data)}`)
            res.end(JSON.stringify({ ok: true }))
          } catch {
            res.statusCode = 400
            res.end(JSON.stringify({ ok: false }))
          }
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), devContactEndpoint()],
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
