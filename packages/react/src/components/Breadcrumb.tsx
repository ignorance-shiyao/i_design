import type { IconName } from '@i-design/common'
import type { ReactNode } from 'react'
import { Icon } from './Icon'

export interface BreadcrumbItem {
  label: string
  /** 传入 href 或 onClick 则渲染为可点击；末项通常都不传 */
  href?: string
  onClick?: () => void
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[]
  /** 传字符串则用文字分隔；默认使用图标，视觉上比斜杠更轻 */
  separator?: string
  separatorIcon?: IconName
}

export function Breadcrumb({ items, separator = '', separatorIcon = 'chevron-right' }: BreadcrumbProps) {
  return (
    <nav className="i-breadcrumb" aria-label="面包屑">
      <ol className="i-breadcrumb__list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          const clickable = !isLast && (item.href || item.onClick)
          let node: ReactNode
          if (clickable) {
            node = (
              <a href={item.href ?? '#'} onClick={item.onClick}>
                {item.label}
              </a>
            )
          } else {
            // 末项代表当前位置，不作为链接，并标记 aria-current
            node = <span className="i-breadcrumb__current" aria-current={isLast ? 'page' : undefined}>{item.label}</span>
          }
          return (
            <li key={item.label} className="i-breadcrumb__item">
              {node}
              {!isLast && (
                <span className="i-breadcrumb__sep" aria-hidden="true">
                  {separator || <Icon name={separatorIcon} size={14} />}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
