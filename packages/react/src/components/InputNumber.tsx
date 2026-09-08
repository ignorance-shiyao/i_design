import { useState, type ChangeEvent, type KeyboardEvent } from 'react'
import { clampNumber, roundTo, stepValue } from '@i-design/common'
import { Icon } from './Icon'

export interface InputNumberProps {
  value?: number | null
  min?: number
  max?: number
  step?: number
  /** 小数位；步进与失焦时都按它取整 */
  precision?: number
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  invalid?: boolean
  placeholder?: string
  /** 隐藏两侧的加减按钮 */
  hideStep?: boolean
  onChange?: (value: number | null) => void
  className?: string
}

export function InputNumber({
  value = null,
  min = Number.NEGATIVE_INFINITY,
  max = Number.POSITIVE_INFINITY,
  step = 1,
  precision = 0,
  size = 'md',
  disabled = false,
  invalid = false,
  placeholder = '',
  hideStep = false,
  onChange,
  className = ''
}: InputNumberProps) {
  const [focused, setFocused] = useState(false)
  /** 输入过程中的原始文本：中途可能是 "-" 或 "1." 这类还不能解析的中间态 */
  const [draft, setDraft] = useState<string | null>(null)

  const display = draft !== null ? draft : value === null ? '' : String(value)
  const normalize = (n: number) => roundTo(clampNumber(n, min, max), precision)

  function stepBy(delta: number) {
    if (disabled) return
    onChange?.(stepValue(value ?? 0, delta * step, min, max, precision))
  }

  function handleInput(event: ChangeEvent<HTMLInputElement>) {
    const text = event.target.value
    setDraft(text)
    if (text === '') {
      onChange?.(null)
      return
    }
    const parsed = Number(text)
    // 中间态不回写，等失焦时再规整，否则用户打不出负数
    if (Number.isFinite(parsed)) onChange?.(parsed)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      stepBy(1)
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      stepBy(-1)
    }
  }

  return (
    <div
      className={[
        'i-input-number',
        `i-input-number--${size}`,
        focused ? 'is-focused' : '',
        disabled ? 'is-disabled' : '',
        invalid ? 'is-invalid' : '',
        className
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {!hideStep && (
        <button
          className="i-input-number__step i-input-number__step--minus"
          type="button"
          aria-label="减少"
          disabled={disabled || (value !== null && value <= min)}
          onClick={() => stepBy(-1)}
        >
          <Icon name="minus" size={14} />
        </button>
      )}

      <input
        className="i-input-number__field"
        type="number"
        inputMode="decimal"
        value={display}
        placeholder={placeholder}
        disabled={disabled}
        min={min === Number.NEGATIVE_INFINITY ? undefined : min}
        max={max === Number.POSITIVE_INFINITY ? undefined : max}
        step={step}
        role="spinbutton"
        aria-valuenow={value ?? undefined}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false)
          setDraft(null)
          if (value !== null) onChange?.(normalize(value))
        }}
      />

      {!hideStep && (
        <button
          className="i-input-number__step i-input-number__step--plus"
          type="button"
          aria-label="增加"
          disabled={disabled || (value !== null && value >= max)}
          onClick={() => stepBy(1)}
        >
          <Icon name="plus" size={14} />
        </button>
      )}
    </div>
  )
}
