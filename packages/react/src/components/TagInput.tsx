import { useRef, useState, type ChangeEvent, type ClipboardEvent, type KeyboardEvent } from 'react'
import {
  DEFAULT_SEPARATORS,
  addTags,
  backspace,
  removeTag,
  splitDraft,
  splitTags
} from '@i-design/common'
import { Icon } from './Icon'

export interface TagInputProps {
  value?: string[]
  onChange?: (tags: string[]) => void
  placeholder?: string
  /** 允许重复。默认不允许——重复的标签在任何筛选场景里都是噪声 */
  allowDuplicate?: boolean
  /** 最多几个 */
  max?: number
  disabled?: boolean
  /** 除回车外，哪些字符也触发成词 */
  separators?: string[]
  /** 拒绝的理由。不给理由的话，用户会以为组件坏了 */
  onReject?: (reason: string) => void
  className?: string
}

export function TagInput({
  value = [],
  onChange,
  placeholder = '输入后回车',
  allowDuplicate = false,
  max = 0,
  disabled = false,
  separators = DEFAULT_SEPARATORS,
  onReject,
  className = ''
}: TagInputProps) {
  const [draft, setDraft] = useState('')
  const [focused, setFocused] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  const full = max > 0 && value.length >= max
  const reason = {
    duplicate: '已经有相同的标签了',
    max: `最多只能添加 ${max} 个`,
    empty: '空白不能作为标签'
  }

  function commit(parts: string[]) {
    if (!parts.length) return
    const result = addTags(value, parts, { allowDuplicate, max, separators })
    if (result.tags.length !== value.length) onChange?.(result.tags)
    if (result.rejected) onReject?.(reason[result.rejected])
  }

  function onInput(event: ChangeEvent<HTMLInputElement>) {
    /*
     * 输入中途遇到分隔符就成词，但最后一段留在输入框里：
     * 粘贴 "a,b,c" 时 c 还该能继续编辑，连它一起变成标签的话，
     * 用户要补字就得先把标签删掉。
     */
    const { ready, rest } = splitDraft(event.target.value, separators)
    setDraft(rest)
    commit(ready)
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      commit(splitTags(draft, separators))
      setDraft('')
      return
    }
    if (event.key === 'Backspace') {
      // 只有输入框为空时才删末项：有内容时删字符是所有输入框的通用行为
      const result = backspace(value, draft)
      if (!result.consumed) return
      event.preventDefault()
      onChange?.(result.tags)
    }
  }

  function onPaste(event: ClipboardEvent<HTMLInputElement>) {
    const text = event.clipboardData.getData('text')
    if (!text) return
    event.preventDefault()
    commit(splitTags(text, separators))
  }

  return (
    // 整个框可点，焦点转给里面的 input：只有 input 可点的话，
    // 标签之间那几像素的空隙点下去毫无反应，用户会以为框是死的
    <div
      className={[
        'i-taginput',
        focused ? 'is-focused' : '',
        disabled ? 'is-disabled' : '',
        full ? 'is-full' : '',
        className
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={() => input.current?.focus()}
    >
      {value.map((tag, i) => (
        <span key={`${tag}-${i}`} className="i-taginput__tag">
          {tag}
          {!disabled && (
            <button
              className="i-taginput__remove"
              aria-label={`移除 ${tag}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onChange?.(removeTag(value, i))
              }}
            >
              <Icon name="close" size={11} />
            </button>
          )}
        </span>
      ))}

      <input
        ref={input}
        className="i-taginput__input"
        value={draft}
        placeholder={value.length ? '' : placeholder}
        disabled={disabled || full}
        aria-label={placeholder}
        onChange={onInput}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false)
          commit(splitTags(draft, separators))
          setDraft('')
        }}
      />

      {/* 上限就摆在框里，而不是等超了再弹提示：先说清楚比事后纠正省事 */}
      {max > 0 && (
        <span className="i-taginput__count">
          {value.length} / {max}
        </span>
      )}
    </div>
  )
}
