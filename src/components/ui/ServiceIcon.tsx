import type { EmblemKind } from '../../content/services'

/**
 * Iconografía lineal de los servicios. Es la alternativa a los emblemas 3D
 * cuando WebGL no está disponible: mismos conceptos, trazo fino y geométrico.
 */
const paths: Record<EmblemKind, React.JSX.Element> = {
  web: (
    <>
      <rect x="8" y="14" width="64" height="48" rx="2" />
      <path d="M8 26h64M16 20h.5M22 20h.5M28 20h.5" />
      <rect x="16" y="34" width="28" height="14" />
      <path d="M52 34h12M52 41h12M16 54h20" />
    </>
  ),
  commerce: (
    <>
      <path d="M18 30h44l-4 38H22z" />
      <path d="M30 30v-6a10 10 0 0 1 20 0v6" />
      <circle cx="62" cy="20" r="7" />
    </>
  ),
  platform: (
    <>
      <path d="m40 12 30 14-30 14-30-14z" />
      <path d="m10 40 30 14 30-14M10 54l30 14 30-14" />
    </>
  ),
  automation: (
    <>
      <circle cx="30" cy="46" r="16" />
      <circle cx="30" cy="46" r="5" />
      <circle cx="58" cy="26" r="10" />
      <circle cx="58" cy="26" r="3" />
      <path d="M30 26v4M30 62v4M10 46h4M46 46h4M58 12v4M58 36v4M44 26h4M68 26h4" />
    </>
  ),
  custom: (
    <>
      <path d="M12 28h28v-8h28v48H12z" />
      <path d="M40 28v12h28" />
      <rect x="46" y="8" width="16" height="16" transform="rotate(12 54 16)" />
    </>
  ),
  optimize: (
    <>
      <path d="M14 58a28 28 0 1 1 52 0" />
      <path d="M40 46 56 26" />
      <circle cx="40" cy="46" r="4" />
      <path d="M40 18v5M20 46h5M55 46h5" />
    </>
  ),
}

export function ServiceIcon({ kind }: { kind: EmblemKind }) {
  return (
    <svg
      className="service-icon"
      viewBox="0 0 80 80"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      focusable="false"
    >
      {paths[kind]}
    </svg>
  )
}
