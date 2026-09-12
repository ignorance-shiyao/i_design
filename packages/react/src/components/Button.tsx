import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { useConfig } from './ConfigProvider'

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
  size,
  loading = false,
  block = false,
  htmlType = 'button',
  disabled,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  /*
   * 尺寸跟随 ConfigProvider，但组件自己传了就以自己的为准。
   * 与文案字典同一条规则：全局配置是兜底，不是强制——所以默认值不能写在解构上，
   * 写了就分不清「没传」与「传了 md」，而这两者在这里的行为不同。
   */
  // useConfig() 必须无条件调用：写成 `size ?? useConfig().size` 的话，
  // 传了 size 时这个 hook 就不执行，hook 调用顺序在两次渲染间不一致
  const config = useConfig()
  const resolvedSize = size ?? config.size
  const classes = [
    'i-button',
    `i-button--${variant}`,
    `i-button--${resolvedSize}`,
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
