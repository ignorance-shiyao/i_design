import { createContext, useContext, useId, type ReactNode } from 'react'

interface RadioGroupContext {
  value?: string | number | boolean
  name: string
  disabled: boolean
  variant: 'default' | 'button'
  onPick: (value: string | number | boolean) => void
}

const Ctx = createContext<RadioGroupContext | null>(null)

export interface RadioGroupProps {
  value?: string | number | boolean
  onChange?: (value: string | number | boolean) => void
  disabled?: boolean
  variant?: 'default' | 'button'
  direction?: 'horizontal' | 'vertical'
  children?: ReactNode
}

export function RadioGroup({
  value,
  onChange,
  disabled = false,
  variant = 'default',
  direction = 'horizontal',
  children
}: RadioGroupProps) {
  // 同组共享 name，原生 radio 的方向键切换与表单提交才会生效
  const name = useId()
  return (
    <Ctx.Provider value={{ value, name, disabled, variant, onPick: (v) => onChange?.(v) }}>
      <div className={`i-radio-group is-${direction}`} role="radiogroup">
        {children}
      </div>
    </Ctx.Provider>
  )
}

export interface RadioProps {
  value: string | number | boolean
  checked?: boolean
  onChange?: (value: string | number | boolean) => void
  disabled?: boolean
  variant?: 'default' | 'button'
  children?: ReactNode
}

export function Radio({
  value,
  checked,
  onChange,
  disabled = false,
  variant = 'default',
  children
}: RadioProps) {
  const group = useContext(Ctx)
  const isChecked = group ? group.value === value : !!checked
  const isDisabled = disabled || (group?.disabled ?? false)
  const shape = group?.variant ?? variant

  const pick = () => {
    if (isDisabled || isChecked) return
    group ? group.onPick(value) : onChange?.(value)
  }

  return (
    <label
      className={[
        'i-radio',
        `i-radio--${shape}`,
        isChecked ? 'is-checked' : '',
        isDisabled ? 'is-disabled' : ''
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* 保留原生 input：读屏播报与键盘行为直接由浏览器提供 */}
      <input
        className="i-radio__input"
        type="radio"
        name={group?.name}
        checked={isChecked}
        disabled={isDisabled}
        onChange={pick}
      />
      {shape === 'default' && <span className="i-radio__mark" aria-hidden="true" />}
      <span className="i-radio__label">{children}</span>
    </label>
  )
}
