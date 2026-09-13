import { useState, type ChangeEvent, type KeyboardEvent } from 'react'
import { useConfig } from './ConfigProvider'
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
  /**
   * 无障碍名。
   *
   * 控件旁边没有可见文字时必须给：读屏用户听到的是「编辑框，空」，
   * 填什么全靠猜。占位文案不算名字——它一开始打字就消失了。
   */
  ariaLabel?: string
  onChange?: (value: number | null) => void
  className?: string
}

export function InputNumber({
  value = null,
  min = Number.NEGATIVE_INFINITY,
  max = Number.POSITIVE_INFINITY,
  step = 1,
  precision = 0,
  size,
  disabled = false,
  invalid = false,
  placeholder = '',
  hideStep = false,
  ariaLabel = '',
  onChange,
  className = ''
}: InputNumberProps) {
  /*
   * 尺寸跟随 ConfigProvider，但组件自己传了就以自己的为准。
   * 与文案字典同一条规则：全局配置是兜底，不是强制——所以默认值不能写在解构上，
   * 写了就分不清「没传」与「传了 md」，而这两者在这里的行为不同。
   */
  // useConfig() 必须无条件调用：写成 `size ?? useConfig().size` 的话，
  // 传了 size 时这个 hook 就不执行，hook 调用顺序在两次渲染间不一致
  const config = useConfig()
  const resolvedSize = size ?? config.size
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
        `i-input-number--${resolvedSize}`,
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
        aria-label={ariaLabel || undefined}
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
