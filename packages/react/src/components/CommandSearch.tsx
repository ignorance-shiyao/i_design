import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { moveCommandIndex, searchCommands, type CommandItem } from '@i-design/common'
import { useConfig } from './ConfigProvider'
import { Icon } from './Icon'
import { Empty } from './Empty'

/**
 * 命令搜索：一个搜索框，一串实时过滤的结果，键盘全程可用。
 *
 * 它解决的是「东西太多，翻不动」——超过几十项的菜单、设置、文档页，
 * 再怎么分组都不如直接搜。所以它的成败全在两件事：排序对不对，
 * 以及能不能一次都不碰鼠标地走完「唤起 → 选中 → 打开」。
 */
export interface CommandSearchProps {
  /** 可搜的全部条目 */
  items: CommandItem[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect?: (item: CommandItem) => void
  placeholder?: string
  /** 最多显示多少条 */
  limit?: number
}

/** 高亮命中的那几个字：把整行都标起来反而看不出重点 */
function parts(label: string, ranges: [number, number][]) {
  if (!ranges.length) return [{ text: label, hit: false }]
  const [[from, to]] = ranges
  return [
    { text: label.slice(0, from), hit: false },
    { text: label.slice(from, to), hit: true },
    { text: label.slice(to), hit: false }
  ].filter((p) => p.text)
}

export function CommandSearch({
  items,
  open,
  onOpenChange,
  onSelect,
  placeholder = '',
  limit = 20
}: CommandSearchProps) {
  const { locale } = useConfig()
  const [keyword, setKeyword] = useState('')
  const [active, setActive] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const listEl = useRef<HTMLUListElement>(null)

  const matches = useMemo(() => searchCommands(items, keyword, limit), [items, keyword, limit])

  useEffect(() => {
    if (!open) return
    // 每次打开都从空查询开始：上一次搜过什么与这一次要找什么没有关系
    setKeyword('')
    setActive(0)
    input.current?.focus()
  }, [open])

  useEffect(() => {
    /*
     * 让高亮项滚进视野。用 nearest 而不是 center：
     * 每按一下方向键整个列表就重新居中一次，读者会失去「我在列表哪个位置」的感觉。
     */
    listEl.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [active])

  if (!open) return null

  const close = () => onOpenChange(false)
  const choose = (item: CommandItem) => {
    onSelect?.(item)
    close()
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((i) => moveCommandIndex(i, 1, matches.length))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((i) => moveCommandIndex(i, -1, matches.length))
    } else if (event.key === 'Enter') {
      const hit = matches[active]
      if (hit) {
        event.preventDefault()
        choose(hit.item)
      }
    } else if (event.key === 'Escape') {
      close()
    }
  }

  const label = placeholder || locale.search

  /* 挂到 body：命令面板压在所有内容之上，父容器的 overflow 与层级都不该影响它 */
  return createPortal(
    <div className="i-cmd" onClick={(e) => e.target === e.currentTarget && close()}>
      <div className="i-cmd__panel" role="dialog" aria-modal="true" aria-label={label}>
        <div className="i-cmd__field">
          <Icon className="i-cmd__icon" name="search" size={16} />
          <input
            ref={input}
            className="i-cmd__input"
            type="text"
            value={keyword}
            placeholder={label}
            aria-label={label}
            role="combobox"
            aria-expanded="true"
            aria-controls="i-cmd-list"
            aria-activedescendant={matches[active] ? `i-cmd-opt-${matches[active].item.key}` : undefined}
            onChange={(e) => {
              setKeyword(e.target.value)
              /* 结果变了就把高亮拉回第一条：停在原来的序号上会指到一条完全不相干的结果 */
              setActive(0)
            }}
            onKeyDown={onKeyDown}
          />
          <kbd className="i-cmd__kbd">Esc</kbd>
        </div>

        {matches.length ? (
          <ul id="i-cmd-list" ref={listEl} className="i-cmd__list" role="listbox">
            {matches.map((match, index) => (
              <li
                key={match.item.key}
                id={`i-cmd-opt-${match.item.key}`}
                className={`i-cmd__item${index === active ? ' is-active' : ''}`}
                data-active={index === active}
                role="option"
                aria-selected={index === active}
                onClick={() => choose(match.item)}
                onMouseMove={() => setActive(index)}
              >
                <div className="i-cmd__main">
                  <span className="i-cmd__label">
                    {parts(match.item.label, match.ranges).map((part, i) => (
                      <span key={i} className={part.hit ? 'i-cmd__hit' : undefined}>
                        {part.text}
                      </span>
                    ))}
                  </span>
                  {match.item.description && <span className="i-cmd__desc">{match.item.description}</span>}
                </div>
                {match.item.group && <span className="i-cmd__group">{match.item.group}</span>}
              </li>
            ))}
          </ul>
        ) : (
          /* 空态给的是「换个词」而不是「没有结果」：后者只是把已经看到的事实重复一遍 */
          <div className="i-cmd__empty">
            <Empty size="sm" type="search" />
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
