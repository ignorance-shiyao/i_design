import { useState, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react'
import { Icon } from './Icon'
import { useConfig } from './ConfigProvider'

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
  placeholder = '',
  size,
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
  /*
   * 尺寸跟随 ConfigProvider，但组件自己传了就以自己的为准。
   * 与文案字典同一条规则：全局配置是兜底，不是强制——所以默认值不能写在解构上，
   * 写了就分不清「没传」与「传了 md」，而这两者在这里的行为不同。
   */
  // useConfig() 必须无条件调用：写成 `size ?? useConfig().size` 的话，
  // 传了 size 时这个 hook 就不执行，hook 调用顺序在两次渲染间不一致
  const config = useConfig()
  const resolvedSize = size ?? config.size
  const { locale } = useConfig()
  /* 传了就用传的，没传才回落到字典——组件自己的默认值不该盖过调用方 */
  const placeholderText = placeholder || locale.placeholder
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
    `i-select-input--${resolvedSize}`,
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
            placeholder={value || placeholderText}
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
            {value || placeholderText}
          </span>
        )}
      </div>

      <span className="i-select-input__suffix">
        {clearable && hasValue && !disabled && (
          <button
            className="i-select-input__clear"
            type="button"
            aria-label={locale.clear}
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
