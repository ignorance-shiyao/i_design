import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  firstMenuActive,
  moveMenuActive,
  resolveOverlay,
  type IconName,
  type Placement
} from '@i-design/common'
import { Icon } from './Icon'

export interface DropdownItem {
  key: string
  label?: string
  icon?: IconName
  /** 快捷键提示，只作展示，不代为绑定 */
  hint?: string
  disabled?: boolean
  /** 危险操作单独着色，删除类命令不应与普通命令同样朴素 */
  danger?: boolean
  divider?: boolean
  /** 分组标题：不可聚焦，仅用于分段 */
  group?: string
}

export interface DropdownProps {
  items: DropdownItem[]
  placement?: Placement
  disabled?: boolean
  onSelect?: (key: string) => void
  children?: ReactNode
}

export function Dropdown({
  items,
  placement = 'bottom',
  disabled = false,
  onSelect,
  children
}: DropdownProps) {
  const triggerRef = useRef<HTMLSpanElement | null>(null)
  const popupRef = useRef<HTMLDivElement | null>(null)
  const [visible, setVisible] = useState(false)
  const [active, setActive] = useState(-1)
  const [pos, setPos] = useState({ x: 0, y: 0, placement, arrow: 0 })

  /** 分隔线与分组标题不参与键盘导航 */
  const navItems = useMemo(
    () => items.map((item) => ({ disabled: item.disabled, divider: !!item.divider || !!item.group })),
    [items]
  )

  const place = useCallback(() => {
    const t = triggerRef.current?.getBoundingClientRect()
    const el = popupRef.current
    if (!t || !el) return
    /*
     * 浮层尺寸用 offsetWidth/offsetHeight，而不是 getBoundingClientRect：
     * 出现动画带 scale(0.97)，用外接矩形会量到缩放中的尺寸，
     * 于是按偏小的宽度算中心，浮层最终停在偏移几像素的位置。
     */
    const p = { x: 0, y: 0, width: el.offsetWidth, height: el.offsetHeight }
    setPos(
      resolveOverlay({
        trigger: t,
        popup: p,
        viewport: { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight },
        placement,
        offset: 4,
        // 菜单通常比触发按钮宽，居中会向左溢出压住旁边的内容
        align: 'start'
      })
    )
  }, [placement])

  useEffect(() => {
    if (!visible) return
    place()
    const onDocumentClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (triggerRef.current?.contains(target) || popupRef.current?.contains(target)) return
      setVisible(false)
      setActive(-1)
    }
    window.addEventListener('scroll', place, { passive: true, capture: true })
    window.addEventListener('resize', place)
    document.addEventListener('click', onDocumentClick)
    return () => {
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
      document.removeEventListener('click', onDocumentClick)
    }
  }, [visible, place])

  const open = () => {
    if (disabled) return
    setVisible(true)
    setActive(firstMenuActive(navItems))
  }

  const close = () => {
    setVisible(false)
    setActive(-1)
  }

  /**
   * 焦点交还触发元素：菜单关闭后焦点若落在 body，键盘用户就失去了位置。
   * 真正可聚焦的是子元素里的控件，不是包裹用的 span。
   */
  const focusTrigger = () => {
    triggerRef.current
      ?.querySelector<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      ?.focus()
  }

  const choose = (item: DropdownItem) => {
    if (item.disabled || item.divider || item.group) return
    onSelect?.(item.key)
    close()
    focusTrigger()
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (!visible) {
      if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        open()
      }
      return
    }
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setActive((current) => moveMenuActive(navItems, current, 1))
        break
      case 'ArrowUp':
        event.preventDefault()
        setActive((current) => moveMenuActive(navItems, current, -1))
        break
      case 'Home':
        event.preventDefault()
        setActive(firstMenuActive(navItems))
        break
      case 'Escape':
        event.preventDefault()
        close()
        focusTrigger()
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        if (active >= 0) choose(items[active])
        break
    }
  }

  return (
    <>
      {/*
        触发器只做包裹，不自称 button：插槽里传入的通常已经是一个真正的按钮，
        外层再声明 role/tabIndex 会形成嵌套按钮语义（读屏念两遍），并多出一个焦点点。
        键盘事件由内部控件冒泡上来，这里照样收得到。
      */}
      <span
        ref={triggerRef}
        className="i-overlay-trigger"
        aria-haspopup="menu"
        aria-expanded={visible}
        onClick={() => (visible ? close() : open())}
        onKeyDown={onKeyDown}
      >
        {children}
      </span>
      {visible &&
        createPortal(
          <div
            ref={popupRef}
            className="i-dropdown"
            style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
            onKeyDown={onKeyDown}
          >
            <ul className="i-dropdown__list" role="menu">
              {items.map((item, index) =>
                item.divider ? (
                  <li key={item.key} className="i-dropdown__divider" role="separator" />
                ) : item.group ? (
                  <li key={item.key} className="i-dropdown__group" role="presentation">
                    {item.group}
                  </li>
                ) : (
                  <li key={item.key} role="none">
                    <button
                      type="button"
                      className={[
                        'i-dropdown__item',
                        index === active ? 'is-active' : '',
                        item.danger ? 'is-danger' : ''
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      role="menuitem"
                      disabled={item.disabled}
                      onClick={() => choose(item)}
                      onMouseEnter={() => setActive(index)}
                    >
                      {item.icon && <Icon name={item.icon} className="i-dropdown__icon" size={16} />}
                      <span>{item.label}</span>
                      {item.hint && <span className="i-dropdown__hint">{item.hint}</span>}
                    </button>
                  </li>
                )
              )}
            </ul>
          </div>,
          document.body
        )}
    </>
  )
}
