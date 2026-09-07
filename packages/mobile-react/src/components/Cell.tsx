import type { ReactNode } from 'react'
import { Icon } from '@i-design/react'

export interface CellProps {
  title: string
  description?: string
  value?: ReactNode
  /** 有 onClick 时显示右箭头并给出按压反馈 */
  onClick?: () => void
  className?: string
}

/** Cell 是移动端信息架构的基本单元：一行承载「是什么 + 当前值 + 能不能进去」 */
export function Cell({ title, description, value, onClick, className = '' }: CellProps) {
  const clickable = !!onClick
  return (
    <div
      className={['i-cell', clickable ? 'is-clickable' : '', className].filter(Boolean).join(' ')}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onClick}
    >
      <div className="i-cell__body">
        <span className="i-cell__title">{title}</span>
        {description && <span className="i-cell__desc">{description}</span>}
      </div>
      {value !== undefined && <span className="i-cell__value">{value}</span>}
      {clickable && <Icon className="i-cell__arrow" name="chevron-right" size={16} />}
    </div>
  )
}
