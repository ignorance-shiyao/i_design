import type { InputHTMLAttributes } from 'react'
import { useConfig } from './ConfigProvider'

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'onChange'> {
  value?: string
  onChange?: (value: string) => void
  size?: 'sm' | 'md' | 'lg'
  invalid?: boolean
}

export function Input({
  value,
  onChange,
  size,
  invalid = false,
  className = '',
  ...rest
}: InputProps) {
  /*
   * 尺寸跟随 ConfigProvider，但组件自己传了就以自己的为准。
   * 与文案字典同一条规则：全局配置是兜底，不是强制——所以默认值不能写在解构上，
   * 写了就分不清「没传」与「传了 md」，而这两者在这里的行为不同。
   */
  // useConfig() 必须无条件调用：写成 `size ?? useConfig().size` 的话，
  // 传了 size 时这个 hook 就不执行，hook 调用顺序在两次渲染间不一致
  const config = useConfig()
  const resolvedSize = size ?? config.size
  const classes = ['i-input', `i-input--${resolvedSize}`, invalid ? 'is-invalid' : '', className]
    .filter(Boolean)
    .join(' ')
  return (
    <input
      className={classes}
      value={value}
      aria-invalid={invalid || undefined}
      onChange={(e) => onChange?.(e.target.value)}
      {...rest}
    />
  )
}
