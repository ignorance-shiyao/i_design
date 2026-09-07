import { createContext, useContext, type ReactNode } from 'react'
import { Icon } from './Icon'

interface CheckboxGroupContext {
  value: (string | number)[]
  disabled: boolean
  atMax: boolean
  toggle: (value: string | number, checked: boolean) => void
}

const Ctx = createContext<CheckboxGroupContext | null>(null)

export interface CheckboxGroupProps {
  value?: (string | number)[]
  onChange?: (value: (string | number)[]) => void
  disabled?: boolean
  /** 最多可选数量，达到后未选中项自动禁用 */
  max?: number
  direction?: 'horizontal' | 'vertical'
  children?: ReactNode
}

export function CheckboxGroup({
  value = [],
  onChange,
  disabled = false,
  max,
  direction = 'horizontal',
  children
}: CheckboxGroupProps) {
  return (
    <Ctx.Provider
      value={{
        value,
        disabled,
        atMax: max !== undefined && value.length >= max,
        toggle: (v, checked) =>
          onChange?.(checked ? [...value, v] : value.filter((item) => item !== v))
      }}
    >
      <div className={`i-checkbox-group is-${direction}`} role="group">
        {children}
      </div>
    </Ctx.Provider>
  )
}

export interface CheckboxProps {
  checked?: boolean
  value?: string | number
  onChange?: (checked: boolean) => void
  disabled?: boolean
  /** 半选态，仅影响视觉，常用于「全选」父项 */
  indeterminate?: boolean
  children?: ReactNode
}

export function Checkbox({
  checked = false,
  value,
  onChange,
  disabled = false,
  indeterminate = false,
  children
}: CheckboxProps) {
  const group = useContext(Ctx)
  const inGroup = group && value !== undefined
  const isChecked = inGroup ? group.value.includes(value) : checked
  // 达到 max 后未选中项不可再勾，已选中的仍可取消——不让用户陷入必须先取消才能操作的死角
  const isDisabled = disabled || (group?.disabled ?? false) || !!(group?.atMax && !isChecked)

  const toggle = () => {
    if (isDisabled) return
    const next = !isChecked
    inGroup ? group.toggle(value, next) : onChange?.(next)
  }

  return (
    <label
      className={[
        'i-checkbox',
        isChecked ? 'is-checked' : '',
        isDisabled ? 'is-disabled' : '',
        indeterminate ? 'is-indeterminate' : ''
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <input
        className="i-checkbox__input"
        type="checkbox"
        checked={isChecked}
        disabled={isDisabled}
        aria-checked={indeterminate ? 'mixed' : isChecked}
        onChange={toggle}
      />
      <span className="i-checkbox__mark" aria-hidden="true">
        {isChecked && !indeterminate && <Icon name="check" size={12} strokeWidth={3} />}
        {indeterminate && <span className="i-checkbox__dash" />}
      </span>
      <span className="i-checkbox__label">{children}</span>
    </label>
  )
}
