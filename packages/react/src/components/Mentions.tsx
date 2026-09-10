import { useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { applyMention, filterMentions, findMention, moveMenuActive } from '@i-design/common'

export interface MentionOption {
  value: string
  label: string
  /** 额外的搜索词，比如拼音或英文名 */
  keywords?: string[]
  desc?: string
  /** 不可选的候选（比如没有权限的成员）仍然列出来，但跳过 */
  disabled?: boolean
}

export interface MentionsProps {
  value?: string
  onChange?: (value: string) => void
  options: MentionOption[]
  /** 触发符，可以多个：@ 提人、/ 唤起命令 */
  symbols?: string[]
  placeholder?: string
  rows?: number
  onSelect?: (option: MentionOption) => void
  className?: string
}

export function Mentions({
  value = '',
  onChange,
  options,
  symbols = ['@'],
  placeholder = '',
  rows = 3,
  onSelect,
  className = ''
}: MentionsProps) {
  const input = useRef<HTMLTextAreaElement>(null)
  const [trigger, setTrigger] = useState<ReturnType<typeof findMention>>(null)
  const [active, setActive] = useState(0)

  const matches = trigger ? filterMentions(options, trigger.query) : []
  const open = !!trigger && matches.length > 0

  function sync() {
    const el = input.current
    if (!el) return
    setTrigger(findMention(el.value, el.selectionStart ?? 0, symbols))
    setActive(0)
  }

  function choose(option: MentionOption) {
    const el = input.current
    if (!el || !trigger) return
    const next = applyMention(el.value, trigger, option.label, el.selectionStart ?? 0)
    onChange?.(next.text)
    onSelect?.(option)
    setTrigger(null)
    // 光标要落回插入点之后，否则用户接着打字会打在句首
    requestAnimationFrame(() => {
      el.setSelectionRange(next.caret, next.caret)
      el.focus()
    })
  }

  function onKeyDown(event: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if (!open) return
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      // 候选没有禁用项时也走同一个循环规则：到底回到头，与菜单、下拉一致
      setActive(moveMenuActive(matches, active, event.key === 'ArrowDown' ? 1 : -1))
    } else if (event.key === 'Enter' || event.key === 'Tab') {
      // 候选开着时回车是「选中」，不是换行
      event.preventDefault()
      choose(matches[active])
    } else if (event.key === 'Escape') {
      setTrigger(null)
    }
  }

  return (
    <div className={['i-mentions', className].filter(Boolean).join(' ')}>
      <textarea
        ref={input}
        className="i-mentions__input"
        value={value}
        placeholder={placeholder}
        rows={rows}
        aria-expanded={open}
        aria-autocomplete="list"
        onChange={(e) => {
          onChange?.(e.target.value)
          sync()
        }}
        onClick={sync}
        onKeyUp={sync}
        onKeyDown={onKeyDown}
        onBlur={() => setTrigger(null)}
      />

      {/*
        候选面板贴在输入框下方，而不是跟着光标走。
        跟随光标要量出插入点的像素位置——textarea 没有这个 API，
        得靠一个隐藏的镜像元素反推，而中文输入法的组合态会让镜像与实际错位。
      */}
      {open && (
        <ul className="i-mentions__list" role="listbox">
          {matches.map((option, index) => (
            <li
              key={option.value}
              className={['i-mentions__option', index === active ? 'is-active' : ''].filter(Boolean).join(' ')}
              role="option"
              aria-selected={index === active}
              onMouseDown={(e) => {
                e.preventDefault()
                choose(option)
              }}
              onMouseEnter={() => setActive(index)}
            >
              <span className="i-mentions__label">{option.label}</span>
              {option.desc && <span className="i-mentions__desc">{option.desc}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
