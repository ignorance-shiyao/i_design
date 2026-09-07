import type { ReactNode } from 'react'

export interface AvatarGroupProps {
  /** 超出部分折叠为 +N */
  max?: number
  total?: number
  children?: ReactNode
}

export function AvatarGroup({ max = 0, total = 0, children }: AvatarGroupProps) {
  return (
    <div className="i-avatar-group">
      {children}
      {total > max && max > 0 && <span className="i-avatar-group__more">+{total - max}</span>}
    </div>
  )
}
