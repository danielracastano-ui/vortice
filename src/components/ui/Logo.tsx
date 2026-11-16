import { useId } from 'react'
import { site } from '../../config/site'
import './Logo.css'

/**
 * Isotipo de Vórtice, vectorizado a partir del logotipo original (logo.jpg):
 * aro exterior abierto, aro interior, dos brazos en espiral que los unen,
 * la V inscrita y el punto lima en órbita. Coordenadas en un lienzo de 100×100.
 */
const OUTER = 'M87.03 25.95A44.15 44.15 0 1 1 75.64 14.06'
const ARM_A =
  'M18.6 43.33L19.14 41.15L19.84 39.02L20.68 36.94L21.1 34.63L21.69 32.31L22.47 30L23.44 27.71L24.59 25.46L25.93 23.27L27.45 21.14L29.16 19.1L31.04 17.16L33.09 15.34L35.31 13.64L37.68 12.09L40.2 10.69L42.85 9.47L45.63 8.42L48.52 7.57L51.5 6.92L54.55 6.74L57.55 7.16L60.52 7.79L63.44 8.63'
const ARM_B =
  'M81.4 56.67L80.86 58.85L80.16 60.98L79.32 63.06L78.9 65.37L78.31 67.69L77.53 70L76.56 72.29L75.41 74.54L74.07 76.73L72.55 78.86L70.84 80.9L68.96 82.84L66.91 84.66L64.69 86.36L62.32 87.91L59.8 89.31L57.15 90.53L54.37 91.58L51.48 92.43L48.5 93.08L45.45 93.26L42.45 92.84L39.48 92.21L36.56 91.37'
const V = 'M28.2 35.4 49.9 79.6 74.9 31.1'

interface LogoMarkProps {
  size?: number
  /** Hace orbitar el aro exterior y su punto (precarga). */
  spinning?: boolean
}

export function LogoMark({ size = 34, spinning = false }: LogoMarkProps) {
  const gradient = useId()
  return (
    <svg
      className="logo__mark"
      data-spinning={spinning || undefined}
      width={size}
      height={size}
      viewBox="-2 -2 104 104"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={gradient} x1="12" y1="88" x2="88" y2="12" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4b1de9" />
          <stop offset="0.5" stopColor="#4d4dfe" />
          <stop offset="1" stopColor="#7d4aff" />
        </linearGradient>
      </defs>
      <g stroke={`url(#${gradient})`}>
        <circle cx="50" cy="50.4" r="31.6" strokeWidth="3.9" />
        <path d={ARM_A} strokeWidth="2.9" strokeLinejoin="round" />
        <path d={ARM_B} strokeWidth="2.9" strokeLinejoin="round" />
        <path d={V} strokeWidth="4" />
      </g>
      <g className="logo__orbit">
        <path d={OUTER} stroke={`url(#${gradient})`} strokeWidth="4.1" />
        <circle cx="81.8" cy="19.65" r="4.3" stroke="var(--lime)" strokeWidth="2.8" />
      </g>
    </svg>
  )
}

export function Logo() {
  return (
    <span className="logo">
      <LogoMark />
      <span className="logo__name">{site.name}</span>
    </span>
  )
}
