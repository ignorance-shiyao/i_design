import type { CSSProperties, ReactNode } from 'react'
import { avatarSizePx } from '@i-design/common'

export interface AvatarGroupProps {
  /** 超出部分折叠为 +N */
  max?: number
  /** 与组内头像保持一致的尺寸档位，决定「+N」圆点的大小 */
  size?: 'sm' | 'md' | 'lg' | number
  total?: number
  children?: ReactNode
}

export function AvatarGroup({ max = 0, size = 'md', total = 0, children }: AvatarGroupProps) {
  // 「+N」圆点要和旁边的头像一样大，样式里只留 md 那一档的落回值
  const style = { '--i-avatar-group-size': `${avatarSizePx(size)}px` } as CSSProperties
  return (
    <div className="i-avatar-group" style={style}>
      {children}
      {total > max && max > 0 && <span className="i-avatar-group__more">+{total - max}</span>}
    </div>
  )
}
