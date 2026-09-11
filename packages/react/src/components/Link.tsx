import type { MouseEvent, ReactNode } from 'react'
import { Icon } from './Icon'
import type { IconName } from '@i-design/common'

export interface LinkProps {
  href?: string
  target?: '_self' | '_blank'
  theme?: 'default' | 'brand' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  /** 下划线时机。默认一直有——颜色不能是「这是个链接」的唯一线索 */
  underline?: 'always' | 'hover' | 'never'
  disabled?: boolean
  prefixIcon?: IconName
  suffixIcon?: IconName
  onClick?: (event: MouseEvent) => void
  children?: ReactNode
}

export function Link({
  href = '',
  target = '_self',
  theme = 'brand',
  size = 'md',
  underline = 'always',
  disabled = false,
  prefixIcon,
  suffixIcon,
  onClick,
  children
}: LinkProps) {
  const classes = [
    'i-link',
    `i-link--${theme}`,
    `i-link--${size}`,
    `i-link--underline-${underline}`,
    disabled ? 'is-disabled' : ''
  ]
    .filter(Boolean)
    .join(' ')

  // 外链默认补角标：点下去会离开当前站点，这件事该在点之前就看得出来
  const trailing = suffixIcon ?? (target === '_blank' ? ('external-link' as IconName) : undefined)

  const handle = (event: MouseEvent) => {
    if (disabled) {
      event.preventDefault()
      return
    }
    onClick?.(event)
  }

  const inner = (
    <>
      {prefixIcon && <Icon className="i-link__icon" name={prefixIcon} size={14} />}
      {children}
      {trailing && <Icon className="i-link__icon" name={trailing} size={14} />}
    </>
  )

  if (href && !disabled) {
    return (
      <a
        className={classes}
        href={href}
        target={target}
        /* 不补 rel 的话，新标签页能通过 window.opener 把原页面导航走 */
        rel={target === '_blank' ? 'noopener noreferrer' : undefined}
        onClick={handle}
      >
        {inner}
      </a>
    )
  }

  return (
    <button type="button" className={classes} disabled={disabled} onClick={handle}>
      {inner}
    </button>
  )
}
