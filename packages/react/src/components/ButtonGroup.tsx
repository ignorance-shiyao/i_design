import type { ReactNode } from 'react'

export interface ButtonGroupProps {
  children?: ReactNode
  className?: string
}

/**
 * 一组紧挨着的按钮。只负责把相接的边拼好（去圆角、边框合成一条），
 * 按钮本身仍是 Button——组合件不该重新实现被组合的那个东西。
 */
export function ButtonGroup({ children, className = '' }: ButtonGroupProps) {
  return (
    <div className={['i-button-group', className].filter(Boolean).join(' ')} role="group">
      {children}
    </div>
  )
}
