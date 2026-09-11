import type { IconName } from '@i-design/common'
import { Icon } from '@i-design/react'

export interface FabProps {
  icon?: IconName
  /** 带文字时按钮拉长；只有图标时收成正圆 */
  text?: string
  placement?: 'right' | 'left'
  /** 滚动时让路：内容比这个入口重要 */
  hidden?: boolean
  onClick?: () => void
}

/**
 * 悬浮操作按钮。一页只该有一个——它表达的是「这一页最主要的那件事」，
 * 出现两个就等于没有主次。
 */
export function Fab({
  icon = 'plus',
  text = '',
  placement = 'right',
  hidden = false,
  onClick
}: FabProps) {
  const classes = [
    'i-fab',
    `i-fab--${placement}`,
    text ? '' : 'i-fab--round',
    hidden ? 'is-hidden' : ''
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      className={classes}
      type="button"
      aria-label={text || '新建'}
      aria-hidden={hidden || undefined}
      onClick={onClick}
    >
      <Icon name={icon} size={22} />
      {text && <span>{text}</span>}
    </button>
  )
}
