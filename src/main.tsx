import '@fontsource-variable/bricolage-grotesque/wdth.css'
import '@fontsource-variable/geist-mono/index.css'
import '@fontsource/montserrat/latin-700.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/tokens.css'
import './styles/base.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
