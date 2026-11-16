import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const base = {
  width: 16,
  height: 16,
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'square' as const,
  'aria-hidden': true,
  focusable: false,
}

export const ArrowRight = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M2 8h11M9 4l4 4-4 4" />
  </svg>
)

export const ArrowUpRight = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M4 12 12 4M5.5 4H12v6.5" />
  </svg>
)

export const ArrowDown = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M8 2v11M4 9l4 4 4-4" />
  </svg>
)

export const Close = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M3 3l10 10M13 3 3 13" />
  </svg>
)

export const Check = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M2.5 8.5 6.5 12l7-8" />
  </svg>
)

export const Alert = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M8 4.5v4.5M8 11.5v.5M1.5 14 8 2l6.5 12z" />
  </svg>
)
