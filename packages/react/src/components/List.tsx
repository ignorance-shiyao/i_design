import { useRef } from 'react'
import { useFlipMove } from './useFlipMove'
import type { ReactNode } from 'react'

export interface ListItem {
  title: string
  description?: string
  /** 附加信息，如时间、作者 */
  meta?: string[]
  disabled?: boolean
}

export interface ListProps {
  items: ListItem[]
  /** 去掉外框与底色，用于嵌在卡片里 */
  plain?: boolean
  header?: string
  footer?: string
  clickable?: boolean
  onSelect?: (item: ListItem, index: number) => void
  renderMedia?: (item: ListItem, index: number) => ReactNode
  renderExtra?: (item: ListItem, index: number) => ReactNode
  className?: string
}

/** 与 Table 的分工：表格用于横向比较字段，列表用于逐条阅读 */
export function List({
  items,
  plain = false,
  header = '',
  footer = '',
  clickable = false,
  onSelect,
  renderMedia,
  renderExtra,
  className = ''
}: ListProps) {
  const root = useRef<HTMLDivElement | null>(null)
  /*
   * 删掉中间一项时让其余项滑过去，而不是跳过去。
   * Vue 端由 TransitionGroup 顺手给了，React 得自己做一次 FLIP；
   * 类名用的是同一个 `i-list-move`，两端的时长与曲线因此一致。
   */
  useFlipMove(root, 'i-list', items.map((i) => i.title).join('|'))

  return (
    <div
      ref={root}
      className={['i-list', plain ? 'i-list--plain' : '', className].filter(Boolean).join(' ')}
    >
      {header && <div className="i-list__header">{header}</div>}

      {items.map((item, index) => (
        <div
          key={item.title + index}
          /*
           * 补位过渡靠这个键认人，因此它必须在增删之间保持稳定。
           * 不能用 `title + index`：删掉中间一项之后，后面每一项的下标都变了，
           * 前一帧的位置就全对不上，动画等于没做。
           */
          data-flip-key={item.title}
          className={['i-list__item', clickable && !item.disabled ? 'is-clickable' : '']
            .filter(Boolean)
            .join(' ')}
          onClick={() => clickable && !item.disabled && onSelect?.(item, index)}
        >
          {renderMedia && <div className="i-list__media">{renderMedia(item, index)}</div>}

          <div className="i-list__body">
            <div className="i-list__title">{item.title}</div>
            {item.description && <div className="i-list__desc">{item.description}</div>}
            {item.meta && item.meta.length > 0 && (
              <div className="i-list__meta">
                {item.meta.map((meta) => (
                  <span key={meta}>{meta}</span>
                ))}
              </div>
            )}
          </div>

          {renderExtra && <div className="i-list__extra">{renderExtra(item, index)}</div>}
        </div>
      ))}

      {footer && <div className="i-list__footer">{footer}</div>}
    </div>
  )
}
