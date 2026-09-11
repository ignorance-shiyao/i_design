import type { ChangeEvent } from 'react'
import { clampNumber, stepValue } from '@i-design/common'
import { Icon } from '@i-design/react'

export interface StepperProps {
  value: number
  onChange?: (value: number) => void
  min?: number
  max?: number
  step?: number
  /** 小数位，步进与失焦时按它取整 */
  precision?: number
  size?: 'sm' | 'md'
  disabled?: boolean
  /** 只读：仍可点加减，但不弹键盘。数量类场景常用 */
  inputDisabled?: boolean
}

/**
 * 步进器。与 Web 的 InputNumber 是两件东西，不是同一件的大号版：
 * 桌面端以键盘输入为主、加减键是补充；手机上反过来——拇指点加减是主路径。
 */
export function Stepper({
  value,
  onChange,
  min = 0,
  max = Number.POSITIVE_INFINITY,
  step = 1,
  precision = 0,
  size = 'md',
  disabled = false,
  inputDisabled = false
}: StepperProps) {
  const commit = (next: number) => {
    const clamped = clampNumber(next, min, max)
    if (clamped === value) return
    onChange?.(clamped)
  }

  const bump = (direction: 1 | -1) =>
    commit(stepValue(value, step * direction, min, max, precision))

  const onInput = (event: ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value
    const parsed = Number(raw)
    // 中途可能是 "" 或 "-"，这时不提交：提交会把用户正在敲的值抹掉
    if (raw === '' || Number.isNaN(parsed)) return
    commit(parsed)
  }

  return (
    <div className={`i-stepper i-stepper--${size}`}>
      <button
        className="i-stepper__btn"
        type="button"
        aria-label="减少"
        disabled={disabled || value <= min}
        onClick={() => bump(-1)}
      >
        <Icon name="minus" size={18} />
      </button>

      <input
        className="i-stepper__input"
        value={value}
        disabled={disabled || inputDisabled}
        inputMode="decimal"
        aria-label="数量"
        onChange={onInput}
      />

      <button
        className="i-stepper__btn"
        type="button"
        aria-label="增加"
        disabled={disabled || value >= max}
        onClick={() => bump(1)}
      >
        <Icon name="plus" size={18} />
      </button>
    </div>
  )
}
