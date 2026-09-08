import type { ReactNode } from 'react'
import { Icon } from '@i-design/react'

export interface NavBarProps {
  title?: string
  /** 显示返回箭头 */
  back?: boolean
  backText?: string
  /** 透明底：用于沉浸式头图页面 */
  transparent?: boolean
  fixed?: boolean
  onBack?: () => void
  left?: ReactNode
  right?: ReactNode
  className?: string
  children?: ReactNode
}

/** 左右两侧等宽，标题才不会因为一侧多一个按钮就偏移 */
export function NavBar({
  title = '',
  back = false,
  backText = '',
  transparent = false,
  fixed = false,
  onBack,
  left,
  right,
  className = '',
  children
}: NavBarProps) {
  return (
    <header
      className={[
        'i-nav-bar',
        transparent ? 'i-nav-bar--transparent' : '',
        fixed ? 'is-fixed' : '',
        className
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="i-nav-bar__side">
        {back && (
          <button className="i-nav-bar__action" onClick={onBack}>
            <Icon name="chevron-left" size={20} />
            {backText && <span>{backText}</span>}
          </button>
        )}
        {left}
      </div>

      <h1 className="i-nav-bar__title">{children ?? title}</h1>

      <div className="i-nav-bar__side i-nav-bar__side--right">{right}</div>
    </header>
  )
}
