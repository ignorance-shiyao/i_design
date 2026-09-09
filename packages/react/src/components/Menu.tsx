import { useEffect, useMemo, useState } from 'react'
import {
  accordionOpenKeys,
  menuEntities,
  openKeysFor,
  type IconName,
  type MenuItem,
  type MenuMode
} from '@i-design/common'
import { Icon } from './Icon'

export interface MenuProps {
  items: MenuItem[]
  value?: string
  mode?: MenuMode
  openKeys?: string[]
  /** 手风琴：同层只展开一个 */
  accordion?: boolean
  /** 收起为图标栏 */
  collapsed?: boolean
  onChange?: (key: string) => void
  onOpenChange?: (keys: string[]) => void
}

export function Menu({
  items,
  value = '',
  mode = 'vertical',
  openKeys,
  accordion = false,
  collapsed = false,
  onChange,
  onOpenChange
}: MenuProps) {
  const entities = useMemo(() => menuEntities(items), [items])
  const [inner, setInner] = useState<string[]>(openKeys ? [...openKeys] : [])

  /*
   * 选中项变化时补上它的祖先分组：从外部（比如路由跳转）切到另一个分支时，
   * 选中项会藏在收起的分组里，用户以为没跳成功。
   */
  useEffect(() => {
    if (!value) return
    setInner((current) => openKeysFor(entities, value, current))
  }, [value, entities])

  const opened = new Set(openKeys ?? inner)

  const toggle = (key: string) => {
    const next = accordion
      ? accordionOpenKeys(entities, opened, key)
      : opened.has(key)
        ? [...opened].filter((k) => k !== key)
        : [...opened, key]
    setInner(next)
    onOpenChange?.(next)
  }

  const choose = (item: MenuItem) => {
    if (item.disabled) return
    onChange?.(item.key)
  }

  return (
    <nav
      className={[
        'i-menu',
        `i-menu--${mode}`,
        collapsed && mode === 'vertical' ? 'is-collapsed' : ''
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {items.map((item) =>
        item.children?.length && mode === 'vertical' ? (
          <div key={item.key}>
            <button
              type="button"
              className="i-menu__group-head"
              aria-expanded={opened.has(item.key)}
              title={collapsed ? item.label : undefined}
              onClick={() => toggle(item.key)}
            >
              {item.icon && <Icon className="i-menu__icon" name={item.icon as IconName} size={16} />}
              <span className="i-menu__label">{item.label}</span>
              <Icon
                className={`i-menu__arrow${opened.has(item.key) ? ' is-open' : ''}`}
                name="chevron-right"
                size={14}
              />
            </button>
            {opened.has(item.key) && (
              <div className="i-menu__sub">
                {item.children.map((child) => (
                  <button
                    key={child.key}
                    type="button"
                    className={[
                      'i-menu__item',
                      value === child.key ? 'is-active' : '',
                      child.disabled ? 'is-disabled' : ''
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    style={collapsed ? undefined : { paddingLeft: '32px' }}
                    disabled={child.disabled}
                    onClick={() => choose(child)}
                  >
                    {child.icon && (
                      <Icon className="i-menu__icon" name={child.icon as IconName} size={16} />
                    )}
                    <span className="i-menu__label">{child.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <button
            key={item.key}
            type="button"
            className={[
              'i-menu__item',
              value === item.key ? 'is-active' : '',
              item.disabled ? 'is-disabled' : ''
            ]
              .filter(Boolean)
              .join(' ')}
            title={collapsed ? item.label : undefined}
            disabled={item.disabled}
            onClick={() => choose(item)}
          >
            {item.icon && <Icon className="i-menu__icon" name={item.icon as IconName} size={16} />}
            <span className="i-menu__label">{item.label}</span>
          </button>
        )
      )}
    </nav>
  )
}
