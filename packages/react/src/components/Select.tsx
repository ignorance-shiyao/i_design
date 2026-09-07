import { useEffect, useRef, useState } from 'react'
import { indexOfValue, moveActive, type OptionLike } from '@i-design/common'
import { Icon } from './Icon'

export interface SelectOption extends OptionLike {
  label: string
}

export interface SelectProps {
  value?: string | number | null
  options: SelectOption[]
  placeholder?: string
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  invalid?: boolean
  clearable?: boolean
  onChange?: (value: string | number | null) => void
}

export function Select({
  value = null,
  options,
  placeholder = '请选择',
  size = 'md',
  disabled = false,
  invalid = false,
  clearable = false,
  onChange
}: SelectProps) {
  const root = useRef<HTMLDivElement | null>(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)

  const selected = options.find((o) => o.value === value) ?? null

  useEffect(() => {
    if (!open) return
    const onClickOutside = (event: MouseEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('click', onClickOutside)
    return () => document.removeEventListener('click', onClickOutside)
  }, [open])

  const toggle = () => {
    if (disabled) return
    if (!open) setActive(indexOfValue(options, value))
    setOpen(!open)
  }

  const pick = (option: SelectOption) => {
    if (option.disabled) return
    onChange?.(option.value)
    setOpen(false)
    setActive(-1)
  }

  // 「跳过禁用项、到边界即停」的规则来自公共层，与 Vue 端同一份实现
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp':
        event.preventDefault()
        if (!open) toggle()
        else setActive((i) => moveActive(options, i, event.key === 'ArrowDown' ? 1 : -1))
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        if (!open) toggle()
        else if (active >= 0) pick(options[active])
        break
      case 'Escape':
        setOpen(false)
        break
    }
  }

  return (
    <div
      ref={root}
      className={['i-select', `i-select--${size}`, open ? 'is-open' : '', disabled ? 'is-disabled' : '']
        .filter(Boolean)
        .join(' ')}
    >
      <button
        className={['i-select__trigger', invalid ? 'is-invalid' : '', !selected ? 'is-placeholder' : '']
          .filter(Boolean)
          .join(' ')}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={toggle}
        onKeyDown={onKeyDown}
      >
        <span className="i-select__label">{selected?.label ?? placeholder}</span>
        {clearable && selected && !disabled && (
          <span
            className="i-select__clear"
            role="button"
            aria-label="清除"
            onClick={(e) => { e.stopPropagation(); onChange?.(null) }}
          >
            <Icon name="close" size={14} />
          </span>
        )}
        <Icon className="i-select__arrow" name="chevron-down" size={16} />
      </button>

      {open && (
        <ul className="i-select__menu" role="listbox">
          {options.map((option, index) => (
            <li
              key={option.value}
              className={[
                'i-select__option',
                option.value === value ? 'is-selected' : '',
                index === active ? 'is-active' : '',
                option.disabled ? 'is-disabled' : ''
              ]
                .filter(Boolean)
                .join(' ')}
              role="option"
              aria-selected={option.value === value}
              aria-disabled={option.disabled || undefined}
              onClick={() => pick(option)}
              onMouseEnter={() => !option.disabled && setActive(index)}
            >
              {option.label}
            </li>
          ))}
          {!options.length && <li className="i-select__empty">暂无数据</li>}
        </ul>
      )}
    </div>
  )
}
