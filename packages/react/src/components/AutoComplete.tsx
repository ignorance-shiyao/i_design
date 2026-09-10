import { useLayoutEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import {
  filterSuggestions,
  matchParts,
  moveActive,
  resolveOverlay,
  type Suggestion
} from '@i-design/common'

export interface AutoCompleteProps {
  value?: string
  onChange?: (value: string) => void
  options: Suggestion[]
  placeholder?: string
  /** 最多列出几条。列太多不如让用户再敲一个字 */
  limit?: number
  disabled?: boolean
  onSelect?: (item: Suggestion) => void
  className?: string
}

export function AutoComplete({
  value = '',
  onChange,
  options,
  placeholder = '',
  limit = 8,
  disabled = false,
  onSelect,
  className = ''
}: AutoCompleteProps) {
  const root = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLUListElement>(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const matches = filterSuggestions(options, value, limit)
  const labelOf = (item: Suggestion) => item.label ?? item.value

  useLayoutEffect(() => {
    if (!open) return
    const trigger = root.current?.getBoundingClientRect()
    const box = panel.current
    if (!trigger || !box) return
    const resolved = resolveOverlay({
      trigger: { x: trigger.x, y: trigger.y, width: trigger.width, height: trigger.height },
      // 量 offsetWidth 而不是 getBoundingClientRect：入场动画里有 scale，
      // 用带变换的尺寸算出来的位置会偏几个像素
      popup: { x: 0, y: 0, width: box.offsetWidth, height: box.offsetHeight },
      viewport: { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight },
      placement: 'bottom',
      align: 'start',
      offset: 4
    })
    setPosition({ x: resolved.x, y: resolved.y })
  }, [open, value, matches.length])

  function onInput(event: ChangeEvent<HTMLInputElement>) {
    onChange?.(event.target.value)
    // 每次改动都把高亮清掉：留着上一次的高亮，回车会选中一个与当前输入无关的项
    setActive(-1)
    setOpen(true)
  }

  function choose(item: Suggestion) {
    if (item.disabled) return
    onChange?.(item.value)
    onSelect?.(item)
    setOpen(false)
    setActive(-1)
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setOpen(false)
      return
    }
    if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      setOpen(true)
      return
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setActive(
        moveActive(
          matches.map((m) => ({ value: m.value, disabled: m.disabled })),
          active,
          event.key === 'ArrowDown' ? 1 : -1
        )
      )
      return
    }
    /*
     * 只有真的高亮了某一条，回车才算「选中候选」；没高亮时回车应当照常提交表单。
     * 反过来做的话，用户敲完一串自定义内容按回车，会被静默替换成第一条候选。
     */
    if (event.key === 'Enter' && open && active >= 0) {
      event.preventDefault()
      choose(matches[active])
    }
  }

  return (
    <div ref={root} className={['i-autocomplete', className].filter(Boolean).join(' ')}>
      {/*
        combobox 三件套缺一不可：读屏靠 aria-expanded 知道下面展开了列表，
        靠 aria-activedescendant 知道当前高亮的是哪一条。少了它们，
        键盘上下移动对读屏用户完全是静默的。
      */}
      <input
        className="i-input i-autocomplete__input"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-activedescendant={active >= 0 ? `i-ac-${active}` : undefined}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={onInput}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
      />

      {open &&
        matches.length > 0 &&
        createPortal(
          <ul
            ref={panel}
            className="i-autocomplete__panel"
            role="listbox"
            style={{ left: position.x, top: position.y, minWidth: root.current?.offsetWidth ?? 0 }}
          >
            {matches.map((item, i) => (
              <li
                id={`i-ac-${i}`}
                key={item.value}
                className={[
                  'i-autocomplete__option',
                  i === active ? 'is-active' : '',
                  item.disabled ? 'is-disabled' : ''
                ]
                  .filter(Boolean)
                  .join(' ')}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => {
                  e.preventDefault()
                  choose(item)
                }}
                onMouseEnter={() => setActive(i)}
              >
                {/* 命中段落由公共层切好：各端自己拼 HTML 既会错位也要处理转义 */}
                {matchParts(labelOf(item), value).map((part, p) => (
                  <span key={p} className={part.hit ? 'is-hit' : undefined}>
                    {part.text}
                  </span>
                ))}
              </li>
            ))}
          </ul>,
          document.body
        )}
    </div>
  )
}
