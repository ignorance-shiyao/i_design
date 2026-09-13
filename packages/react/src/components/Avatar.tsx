import { useEffect, useState } from 'react'
import {
  avatarSizePx,
  initialsOf,
  tintInkOf,
  tintOf,
  type IconName
} from '@i-design/common'
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

  const px = avatarSizePx(size)
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
        background: showImage ? undefined : colorful ? tintOf(name) : tintOf(''),
        /*
         * 字色按底色算，不写死白字：六个底色里有一半压不住白字
         * （绿 2.25、橙 2.18、红 2.84），写死 #fff 会让一半的头像上那两个字糊掉。
         */
        color: showImage ? undefined : tintInkOf(colorful ? name : '')
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
