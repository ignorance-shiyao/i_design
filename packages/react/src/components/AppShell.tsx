/**
 * 应用骨架：顶栏、侧栏导航、面包屑、页面操作槽、窄屏抽屉（astra.md 的 B01）。
 *
 * 窄屏是抽屉而不是把侧栏挤窄：挤窄之后每一项只剩两三个字，认不出来还占着地方。
 * 关抽屉时焦点还给触发按钮，Esc 也能关——否则键盘用户会被困在里面，
 * 或者被丢回页面顶部重新 Tab 一遍。
 *
 * 组件不认识路由：导航项点了只回调，由页面决定怎么跳。
 */
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Breadcrumb } from './Breadcrumb'
import { Icon } from './Icon'
import type { IconName } from '@i-design/common'

export interface AppNavItem {
  key: string
  label: string
  icon?: IconName
  /** 二级导航。只支持两级——三级以上的树在侧栏里没人找得到 */
  children?: { key: string; label: string }[]
}

export interface AppShellProps {
  nav: AppNavItem[]
  /** 当前选中的导航项 key。深链刷新后由页面从地址里解析出来传进来 */
  current: string
  crumbs?: { label: string }[]
  title?: string
  user?: string
  /** 窄屏断点（px）。小于它时侧栏收进抽屉 */
  breakpoint?: number
  onNavigate?: (key: string) => void
  /** 顶栏中段：切换器、搜索、环境标记，各家都不一样 */
  topbar?: ReactNode
  /** 页面操作槽 */
  actions?: ReactNode
  drawerExtra?: ReactNode
  children?: ReactNode
  className?: string
}

export function AppShell({
  nav,
  current,
  crumbs = [],
  title = '',
  user = '',
  breakpoint = 720,
  onNavigate,
  topbar,
  actions,
  drawerExtra,
  children,
  className = ''
}: AppShellProps) {
  const [drawer, setDrawer] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    // Esc 关闭：打开的浮层一律如此，否则键盘用户会被困在里面
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawer(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  /* 关抽屉时把焦点还回按钮：不还的话键盘用户被丢回页面顶部 */
  useEffect(() => {
    if (!drawer) trigger.current?.focus()
  }, [drawer])

  const go = (key: string) => {
    setDrawer(false)
    onNavigate?.(key)
  }

  const crumbItems = [...(title ? [{ label: title }] : []), ...crumbs]
  /** 二级选中时它的父项也要显示为激活，否则用户不知道自己在哪一块里 */
  const activeParent =
    nav.find((item) => item.key === current || item.children?.some((c) => c.key === current))?.key ?? ''

  const navButton = (item: { key: string; label: string; icon?: IconName }, child = false) => (
    <button
      key={`${child ? 'c' : 'p'}-${item.key}`}
      type="button"
      className={[
        'i-app-shell__nav',
        child ? 'is-child' : '',
        item.key === current ? 'is-on' : '',
        !child && activeParent === item.key ? 'is-parent' : ''
      ]
        .filter(Boolean)
        .join(' ')}
      aria-current={item.key === current ? 'page' : undefined}
      onClick={() => go(item.key)}
    >
      {item.icon && <Icon name={item.icon} size={16} />}
      {item.label}
    </button>
  )

  return (
    <div
      className={['i-app-shell', className].filter(Boolean).join(' ')}
      style={{ ['--i-app-shell-breakpoint' as string]: `${breakpoint}px` }}
    >
      <header className="i-app-shell__bar">
        <button
          ref={trigger}
          type="button"
          className="i-app-shell__toggle"
          aria-expanded={drawer}
          aria-label="打开导航"
          onClick={() => setDrawer(true)}
        >
          <Icon name="menu" size={18} />
        </button>
        {title && <span className="i-app-shell__title">{title}</span>}
        <div className="i-app-shell__slot">{topbar}</div>
        {user && <span className="i-app-shell__user">{user}</span>}
      </header>

      <div className="i-app-shell__body">
        <nav className="i-app-shell__aside" aria-label="主导航">
          {nav.flatMap((item) => [navButton(item), ...(item.children ?? []).map((c) => navButton(c, true))])}
        </nav>

        <main className="i-app-shell__main">
          <div className="i-app-shell__head">
            {crumbItems.length > 0 && <Breadcrumb items={crumbItems} />}
            <div className="i-app-shell__actions">{actions}</div>
          </div>
          {children}
        </main>
      </div>

      {/* 窄屏抽屉：要用时才出现，用完就还回去 */}
      {drawer && (
        <div className="i-app-shell__scrim" onClick={() => setDrawer(false)}>
          <div
            className="i-app-shell__drawer"
            role="dialog"
            aria-modal="true"
            aria-label="导航"
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" className="i-app-shell__close" onClick={() => setDrawer(false)}>
              关闭
            </button>
            {drawerExtra}
            {nav.flatMap((item) => [navButton(item), ...(item.children ?? []).map((c) => navButton(c, true))])}
          </div>
        </div>
      )}
    </div>
  )
}
