import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Icon } from '@i-design/react'

export interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  shape?: 'round' | 'square'
  /** 右侧「取消」：聚焦后才出现，不占用未使用时的横向空间 */
  cancelable?: boolean
  cancelText?: string
  disabled?: boolean
  readOnly?: boolean
  onSearch?: (value: string) => void
  onClear?: () => void
  onCancel?: () => void
  className?: string
}

export function SearchBar({
  value,
  onChange,
  placeholder = '搜索',
  shape = 'round',
  cancelable = true,
  cancelText = '取消',
  disabled = false,
  readOnly = false,
  onSearch,
  onClear,
  onCancel,
  className = ''
}: SearchBarProps) {
  const [focused, setFocused] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const showCancel = cancelable && (focused || value !== '')

  function submit(event: FormEvent) {
    event.preventDefault()
    onSearch?.(value)
  }

  return (
    /*
     * 用 <form action=".">：iOS Safari 只有在表单里、且存在 type="search"
     * 的输入框时，软键盘的回车键才会显示成「搜索」。纯 div 包裹时用户按到的是换行。
     */
    <form className={['i-search-bar', className].filter(Boolean).join(' ')} action="." onSubmit={submit}>
      <div
        className={['i-search-bar__field', `i-search-bar__field--${shape}`, disabled ? 'is-disabled' : '']
          .filter(Boolean)
          .join(' ')}
      >
        <Icon name="search" className="i-search-bar__icon" />
        <input
          ref={input}
          className="i-search-bar__input"
          type="search"
          enterKeyHint="search"
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {value && !readOnly && !disabled && (
          <button
            type="button"
            className="i-search-bar__clear"
            aria-label="清空"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onChange('')
              onClear?.()
              input.current?.focus()
            }}
          >
            <Icon name="close" />
          </button>
        )}
      </div>
      {showCancel && (
        <button
          type="button"
          className="i-search-bar__cancel"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            onChange('')
            onCancel?.()
            input.current?.blur()
          }}
        >
          {cancelText}
        </button>
      )}
    </form>
  )
}
