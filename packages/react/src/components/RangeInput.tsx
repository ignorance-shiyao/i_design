import { useState, type ChangeEvent } from 'react'
import { orderRange, type RangeValue } from '@i-design/common'

export interface RangeInputProps {
  value?: RangeValue
  onChange?: (value: RangeValue) => void
  placeholders?: [string, string]
  separator?: string
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  invalid?: boolean
  /**
   * 失焦时若起大于止就自动对调。只在失焦时做——
   * 用户把 100 改成 10 的中途数值会短暂小于起点，这时对调会把刚敲的字搬到另一个框里。
   */
  autoOrder?: boolean
  className?: string
}

export function RangeInput({
  value = ['', ''],
  onChange,
  placeholders = ['开始', '结束'],
  separator = '—',
  size = 'md',
  disabled = false,
  invalid = false,
  autoOrder = true,
  className = ''
}: RangeInputProps) {
  const [focused, setFocused] = useState(false)

  const classes = [
    'i-range-input',
    `i-range-input--${size}`,
    focused ? 'is-focused' : '',
    disabled ? 'is-disabled' : '',
    invalid ? 'is-invalid' : '',
    className
  ]
    .filter(Boolean)
    .join(' ')

  const setPart = (index: 0 | 1) => (event: ChangeEvent<HTMLInputElement>) => {
    const next: RangeValue =
      index === 0 ? [event.target.value, value[1]] : [value[0], event.target.value]
    onChange?.(next)
  }

  const onBlur = () => {
    setFocused(false)
    if (!autoOrder) return
    const ordered = orderRange(value)
    if (ordered !== value) onChange?.(ordered)
  }

  return (
    <div className={classes}>
      <input
        className="i-range-input__field"
        value={value[0]}
        placeholder={placeholders[0]}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        aria-label={placeholders[0]}
        onChange={setPart(0)}
        onFocus={() => setFocused(true)}
        onBlur={onBlur}
      />

      <span className="i-range-input__separator" aria-hidden="true">
        {separator}
      </span>

      <input
        className="i-range-input__field i-range-input__field--end"
        value={value[1]}
        placeholder={placeholders[1]}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        aria-label={placeholders[1]}
        onChange={setPart(1)}
        onFocus={() => setFocused(true)}
        onBlur={onBlur}
      />
    </div>
  )
}
