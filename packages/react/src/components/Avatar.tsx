import { useEffect, useState } from 'react'
import { initialsOf, tintOf, type IconName } from '@i-design/common'
import { Icon } from './Icon'

export interface AvatarProps {
  src?: string
  name?: string
  icon?: IconName
  size?: 'sm' | 'md' | 'lg' | number
  shape?: 'circle' | 'square'
  colorful?: boolean
  className?: string
}

const sizeMap = { sm: 24, md: 32, lg: 44 }

export function Avatar({
  src = '',
  name = '',
  icon = 'user',
  size = 'md',
  shape = 'circle',
  colorful = true,
  className = ''
}: AvatarProps) {
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [src])

  const px = typeof size === 'number' ? size : sizeMap[size]
  // 取字与配色规则来自公共层：同一个人在 Vue 端和 React 端结果一致
  const initials = initialsOf(name)
  const showImage = !!src && !failed

  return (
    <span
      className={['i-avatar', `is-${shape}`, className].filter(Boolean).join(' ')}
      style={{
        width: px,
        height: px,
        fontSize: Math.max(11, Math.round(px * 0.38)),
        background: showImage ? undefined : colorful ? tintOf(name) : tintOf('')
      }}
      title={name || undefined}
    >
      {showImage ? (
        <img src={src} alt={name} onError={() => setFailed(true)} />
      ) : initials ? (
        <span>{initials}</span>
      ) : (
        <Icon name={icon} size={Math.round(px * 0.5)} />
      )}
    </span>
  )
}
