import type { InputHTMLAttributes } from 'react'

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'onChange'> {
  value?: string
  onChange?: (value: string) => void
  size?: 'sm' | 'md' | 'lg'
  invalid?: boolean
}

export function Input({
  value,
  onChange,
  size = 'md',
  invalid = false,
  className = '',
  ...rest
}: InputProps) {
  const classes = ['i-input', `i-input--${size}`, invalid ? 'is-invalid' : '', className]
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
