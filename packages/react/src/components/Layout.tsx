import type { CSSProperties, ReactNode } from 'react'

export interface LayoutProps {
  header?: ReactNode
  aside?: ReactNode
  footer?: ReactNode
  /** 侧栏在哪一边 */
  asidePlacement?: 'left' | 'right'
  /** 侧栏收起，只留图标宽度。不整个藏掉——入口消失比变窄更难找回来 */
  collapsed?: boolean
  asideWidth?: string
  headerHeight?: string
  children?: ReactNode
  className?: string
}

/**
 * 页面骨架：顶栏、侧栏、正文、底栏。
 * 四块都用语义标签落地——读屏用户靠这几个地标在页面里跳转。
 */
export function Layout({
  header,
  aside,
  footer,
  asidePlacement = 'left',
  collapsed = false,
  asideWidth,
  headerHeight,
  children,
  className = ''
}: LayoutProps) {
  const style = {
    '--i-layout-aside-width': asideWidth,
    '--i-layout-header-height': headerHeight
  } as CSSProperties

  return (
    <div
      className={['i-layout', `i-layout--aside-${asidePlacement}`, className]
        .filter(Boolean)
        .join(' ')}
      style={style}
    >
      {header && <header className="i-layout__header">{header}</header>}

      <div className="i-layout__row">
        {aside && (
          <aside className={['i-layout__aside', collapsed ? 'is-collapsed' : ''].filter(Boolean).join(' ')}>
            {aside}
          </aside>
        )}
        <main className="i-layout__content">{children}</main>
      </div>

      {footer && <footer className="i-layout__footer">{footer}</footer>}
    </div>
  )
}
