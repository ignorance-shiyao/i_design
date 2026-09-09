import type { ButtonHTMLAttributes, ReactNode } from 'react'

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  /** 视觉层级：主按钮 / 次按钮 / 文字按钮 / 危险操作 */
  variant?: 'primary' | 'secondary' | 'text' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  block?: boolean
  /** 原生 type，默认 button，避免在表单里意外提交 */
  htmlType?: 'button' | 'submit' | 'reset'
  children?: ReactNode
}

export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  block = false,
  htmlType = 'button',
  disabled,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  const classes = [
    'i-button',
    `i-button--${variant}`,
    `i-button--${size}`,
    block ? 'is-block' : '',
    loading ? 'is-loading' : '',
    className
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button className={classes} type={htmlType} disabled={disabled || loading} {...rest}>
      {loading && <span className="i-button__spinner" aria-hidden="true" />}
      {children}
    </button>
  )
}
