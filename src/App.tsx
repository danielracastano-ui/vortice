import { useCallback, useEffect, useLayoutEffect, useMemo, useState, type ComponentType } from 'react'
import { ContactDialog } from './components/contact/ContactDialog'
import { ContactProvider, useContact } from './components/contact/ContactContext'
import { StaticBackdrop } from './components/fallback/StaticBackdrop'
import { Footer } from './components/layout/Footer'
import { Header } from './components/layout/Header'
import { Preloader } from './components/layout/Preloader'
import { SectionIndicator } from './components/layout/SectionIndicator'
import { About } from './components/sections/About'
import { FinalCta } from './components/sections/FinalCta'
import { Hero } from './components/sections/Hero'
import { Principles } from './components/sections/Principles'
import { Process } from './components/sections/Process'
import { Services } from './components/sections/Services'
import { Work } from './components/sections/Work'
import { sections } from './config/site'
import { useActiveSection } from './hooks/useActiveSection'
import { useReducedMotion } from './hooks/useMediaQuery'
import { detectGfx, type GfxTier } from './lib/device'
import { GfxContext, type Phase } from './lib/gfx-context'
import { gsap, initSmoothScroll, lockScroll, ScrollTrigger, scrollToId } from './lib/scroll'
import { stage } from './lib/stage'
import './App.css'

type ExperienceComponent = ComponentType<{
  tier: Exclude<GfxTier, 'off'>
  paused: boolean
  onReady: () => void
  onFail: () => void
}>

const SECTION_IDS = sections.map((s) => s.id)

/**
 * Arranque de la página: carga fuentes y (si procede) el módulo WebGL en
 * diferido, informa del progreso real al precargador y marca las fases
 * loading → intro → ready.
 */
function useBoot(tier: GfxTier, onSceneFail: () => void) {
  const [Experience, setExperience] = useState<ExperienceComponent | null>(null)
  const [done, setDone] = useState({ fonts: false, chunk: false, scene: false })
  const [phase, setPhase] = useState<Phase>('loading')

  useEffect(() => {
    let alive = true
    const mark = (key: keyof typeof done) => alive && setDone((d) => ({ ...d, [key]: true }))

    document.fonts.ready.then(() => mark('fonts'))

    if (tier === 'off') {
      mark('chunk')
      mark('scene')
    } else {
      // Three.js y la escena viajan en un chunk aparte: no bloquean el primer render.
      import('./three/Experience')
        .then((module) => {
          if (!alive) return
          setExperience(() => module.default)
          mark('chunk')
        })
        .catch(() => alive && onSceneFail())
    }

    // Red de seguridad: la página nunca se queda atrapada en la precarga.
    const timeout = window.setTimeout(() => alive && setDone({ fonts: true, chunk: true, scene: true }), 12000)
    return () => {
      alive = false
      window.clearTimeout(timeout)
    }
  }, [tier, onSceneFail])

  const progress = 8 + (done.fonts ? 22 : 0) + (done.chunk ? 30 : 0) + (done.scene ? 40 : 0)
  const onSceneReady = useCallback(() => setDone((d) => ({ ...d, scene: true })), [])

  return { Experience, progress, phase, setPhase, onSceneReady }
}

function Page() {
  const [tier, setTier] = useState<GfxTier>(detectGfx)
  const reduced = useReducedMotion()
  const contact = useContact()
  const activeId = useActiveSection(SECTION_IDS)
  const [hidden, setHidden] = useState(false)

  const failToStatic = useCallback(() => setTier('off'), [])
  const { Experience, progress, phase, setPhase, onSceneReady } = useBoot(tier, failToStatic)

  stage.tier = tier
  stage.reducedMotion = reduced

  // La fase se refleja en <html> para que el CSS coordine cabecera e indicadores.
  useLayoutEffect(() => {
    document.documentElement.dataset.phase = phase
  }, [phase])

  // Scroll suave (desactivado con "reducir movimiento").
  useEffect(() => {
    if (reduced) return
    return initSmoothScroll()
  }, [reduced])

  // Durante la precarga la página no se desplaza.
  useEffect(() => {
    window.history.scrollRestoration = 'manual'
    lockScroll(true)
    return () => lockScroll(false)
  }, [])

  const startIntro = useCallback(() => {
    setPhase('intro')
    lockScroll(false)
    ScrollTrigger.refresh()
    const hash = window.location.hash.slice(1)
    const deepLink = hash && document.getElementById(hash)
    if (reduced || deepLink) {
      stage.intro.value = 1
      setPhase('ready')
      if (hash) scrollToId(hash, { immediate: true })
      return
    }
    gsap.to(stage.intro, {
      value: 1,
      duration: 3.2,
      ease: 'power2.out',
      delay: 0.1,
      onComplete: () => setPhase('ready'),
    })
  }, [reduced, setPhase])

  // Cursor normalizado para la escena (solo ratón).
  useEffect(() => {
    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      stage.pointer.x = (event.clientX / window.innerWidth) * 2 - 1
      stage.pointer.y = -((event.clientY / window.innerHeight) * 2 - 1)
      stage.pointer.active = true
    }
    const leave = () => {
      stage.pointer.active = false
    }
    window.addEventListener('pointermove', move, { passive: true })
    document.documentElement.addEventListener('pointerleave', leave)
    return () => {
      window.removeEventListener('pointermove', move)
      document.documentElement.removeEventListener('pointerleave', leave)
    }
  }, [])

  // Enlaces internos (#seccion): desplazamiento animado + foco accesible.
  useEffect(() => {
    const handle = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey) return
      const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]')
      const id = link?.getAttribute('href')?.slice(1)
      if (!id || !scrollToId(id)) return
      event.preventDefault()
      window.history.pushState(null, '', `#${id}`)
    }
    document.addEventListener('click', handle)
    return () => document.removeEventListener('click', handle)
  }, [])

  // Si cambia la altura del documento (fuentes, imágenes), se recalculan los disparadores.
  useEffect(() => {
    let frame = 0
    let last = document.body.offsetHeight
    const observer = new ResizeObserver(() => {
      const height = document.body.offsetHeight
      if (Math.abs(height - last) < 2) return
      last = height
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => ScrollTrigger.refresh())
    })
    observer.observe(document.body)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [])

  // El render 3D se pausa con la pestaña oculta o con el panel de contacto abierto.
  useEffect(() => {
    const handle = () => setHidden(document.hidden)
    document.addEventListener('visibilitychange', handle)
    return () => document.removeEventListener('visibilitychange', handle)
  }, [])

  const backdrop = useMemo(
    () =>
      tier !== 'off' && Experience ? (
        <Experience
          tier={tier}
          paused={hidden || contact.isOpen}
          onReady={onSceneReady}
          onFail={failToStatic}
        />
      ) : tier === 'off' ? (
        <StaticBackdrop />
      ) : null,
    [tier, Experience, hidden, contact.isOpen, onSceneReady, failToStatic],
  )

  return (
    <GfxContext.Provider value={tier}>
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>
      <Preloader progress={progress} onExited={startIntro} />

      <div className="backdrop" aria-hidden="true">
        {backdrop}
        <div className="backdrop__vignette" />
        <div className="backdrop__grain" />
      </div>

      <Header activeId={activeId} />
      <SectionIndicator activeId={activeId} />

      <main id="contenido">
        <Hero phase={phase} />
        <About />
        <Services />
        <Process />
        <Work />
        <Principles />
        <FinalCta />
      </main>
      <Footer home />
      <ContactDialog />
    </GfxContext.Provider>
  )
}

export default function App() {
  return (
    <ContactProvider>
      <Page />
    </ContactProvider>
  )
}
