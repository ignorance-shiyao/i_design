import { useState, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react'
import { Icon } from './Icon'

export interface SelectInputProps {
  /** 单选时显示的文案；多选请用 tags */
  value?: string
  placeholder?: string
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  invalid?: boolean
  clearable?: boolean
  /** 允许在框内输入，用于可搜索的选择器 */
  filterable?: boolean
  keyword?: string
  onKeywordChange?: (keyword: string) => void
  /** 面板开合由调用方持有：它才知道选完要不要关 */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onClear?: () => void
  tags?: ReactNode
  className?: string
}

/**
 * 选择器外壳：长得像输入框、点开是一个面板。
 * Select、Cascader、TreeSelect 外面那一层是同一件东西，单独成件才对得齐。
 */
export function SelectInput({
  value = '',
  placeholder = '请选择',
  size = 'md',
  disabled = false,
  invalid = false,
  clearable = false,
  filterable = false,
  keyword = '',
  onKeywordChange,
  open = false,
  onOpenChange,
  onClear,
  tags,
  className = ''
}: SelectInputProps) {
  const [focused, setFocused] = useState(false)
  const hasValue = value !== '' || keyword !== ''

  const toggle = () => {
    if (disabled) return
    onOpenChange?.(!open)
  }

  const handleClear = (event: MouseEvent) => {
    // 清除不该顺带把面板打开：它们是两件事
    event.stopPropagation()
    onKeywordChange?.('')
    onClear?.()
  }

  const handleKeydown = (event: KeyboardEvent) => {
    if (disabled) return
    if (event.key === 'Enter' || event.key === ' ') {
      // 可输入时空格是正常字符，不能拿去开合面板
      if (filterable && event.key === ' ') return
      event.preventDefault()
      toggle()
    } else if (event.key === 'Escape' && open) {
      event.preventDefault()
      onOpenChange?.(false)
    } else if (event.key === 'ArrowDown' && !open) {
      event.preventDefault()
      onOpenChange?.(true)
    }
  }

  const classes = [
    'i-select-input',
    `i-select-input--${size}`,
    open ? 'is-open' : '',
    focused ? 'is-focused' : '',
    disabled ? 'is-disabled' : '',
    invalid ? 'is-invalid' : '',
    className
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={classes}
      role="combobox"
      aria-expanded={open}
      aria-haspopup="listbox"
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? undefined : 0}
      onClick={toggle}
      onKeyDown={handleKeydown}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      <div className="i-select-input__body">
        {tags}

        {filterable ? (
          <input
            className="i-select-input__input"
            value={keyword}
            placeholder={value || placeholder}
            disabled={disabled}
            onChange={(event) => onKeywordChange?.(event.target.value)}
            onClick={(event) => event.stopPropagation()}
          />
        ) : (
          <span
            className={['i-select-input__value', value ? '' : 'i-select-input__placeholder']
              .filter(Boolean)
              .join(' ')}
          >
            {value || placeholder}
          </span>
        )}
      </div>

      <span className="i-select-input__suffix">
        {clearable && hasValue && !disabled && (
          <button
            className="i-select-input__clear"
            type="button"
            aria-label="清除"
            onClick={handleClear}
          >
            <Icon name="close" size={14} />
          </button>
        )}
        <Icon className="i-select-input__arrow" name="chevron-down" size={16} />
      </span>
    </div>
  )
}
