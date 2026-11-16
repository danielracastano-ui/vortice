import { useRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { useMagnetic } from '../../hooks/useMagnetic'
import { ArrowRight, ArrowUpRight } from './icons'
import './Button.css'

interface BaseProps {
  variant?: 'primary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  icon?: 'arrow' | 'external' | 'none'
  magnetic?: boolean
  children: ReactNode
}

type AsButton = BaseProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & { href?: undefined }
type AsLink = BaseProps & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children'> & { href: string }

export function Button(props: AsButton | AsLink) {
  const { variant = 'primary', size = 'md', icon = 'arrow', magnetic = false, children, className, ...rest } = props
  const ref = useRef<HTMLElement | null>(null)
  useMagnetic(ref, magnetic)

  const classes = ['btn', `btn--${variant}`, `btn--${size}`, className].filter(Boolean).join(' ')
  const Icon = icon === 'external' ? ArrowUpRight : ArrowRight
  const content = (
    <>
      <span className="btn__fill" aria-hidden="true" />
      <span className="btn__label">{children}</span>
      {icon !== 'none' && (
        <span className="btn__icon" aria-hidden="true">
          <Icon />
          <Icon />
        </span>
      )}
    </>
  )

  if (rest.href !== undefined) {
    return (
      <a ref={ref as React.Ref<HTMLAnchorElement>} className={classes} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {content}
      </a>
    )
  }
  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      type="button"
      className={classes}
      {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {content}
    </button>
  )
}
