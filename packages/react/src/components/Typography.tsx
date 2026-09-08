import { createElement, type CSSProperties, type ReactNode } from 'react'

export interface TypographyProps {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'body' | 'caption'
  type?: 'default' | 'secondary' | 'tertiary' | 'brand' | 'success' | 'warning' | 'danger'
  strong?: boolean
  italic?: boolean
  underline?: boolean
  /** 删除线，用于表示已失效的值 */
  del?: boolean
  mono?: boolean
  /** true 单行省略；数字表示最多几行 */
  ellipsis?: boolean | number
  /** 覆盖默认标签 */
  as?: string
  className?: string
  children?: ReactNode
}

export function Typography({
  variant = 'body',
  type = 'default',
  strong = false,
  italic = false,
  underline = false,
  del = false,
  mono = false,
  ellipsis = false,
  as,
  className = '',
  children
}: TypographyProps) {
  // 标题的样式与标签默认绑定：视觉层级与文档结构一致，读屏才能正确导航
  const tag = as || (variant.startsWith('h') ? variant : variant === 'caption' ? 'span' : 'p')
  const lines = typeof ellipsis === 'number' ? ellipsis : 0

  return createElement(
    tag,
    {
      className: [
        'i-typo',
        `i-typo--${variant}`,
        type !== 'default' ? `i-typo--${type}` : '',
        strong ? 'is-strong' : '',
        italic ? 'is-italic' : '',
        underline ? 'is-underline' : '',
        del ? 'is-delete' : '',
        mono ? 'is-mono' : '',
        ellipsis === true ? 'is-ellipsis' : '',
        lines > 0 ? 'is-clamp' : '',
        className
      ]
        .filter(Boolean)
        .join(' '),
      style: lines > 0 ? ({ '--i-typo-lines': lines } as CSSProperties) : undefined
    },
    children
  )
}
