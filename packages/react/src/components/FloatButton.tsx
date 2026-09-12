import { useState, type CSSProperties } from 'react'
import {
  floatActionDelay,
  floatActionShift,
  type FloatAction,
  type IconName
} from '@i-design/common'
import { Icon } from './Icon'

/**
 * 悬浮操作按钮。
 *
 * 一页只该有一个：它代表「这一页最主要的那件事」。出现两个就等于没有主次，
 * 用户还得先读一遍才知道点哪个。
 */
export interface FloatButtonProps {
  icon?: IconName
  /** 带文字时按钮拉长；只有图标时收成正圆 */
  text?: string
  /** 展开后的次级动作。为空时按钮只发 onClick */
  actions?: FloatAction[]
  placement?: 'bottom-right' | 'bottom-left'
  /** 距视口边缘的距离 */
  offset?: number
  /** 受控展开态；不传则组件自己管 */
  open?: boolean
  onClick?: () => void
  onSelect?: (key: string) => void
  onOpenChange?: (open: boolean) => void
  className?: string
}

export function FloatButton({
  icon = 'plus',
  text = '',
  actions = [],
  placement = 'bottom-right',
  offset = 24,
  open,
  onClick,
  onSelect,
  onOpenChange,
  className = ''
}: FloatButtonProps) {
  const [inner, setInner] = useState(false)
  const expanded = open ?? inner
  const hasActions = actions.length > 0

  const toggle = () => {
    if (!hasActions) {
      onClick?.()
      return
    }
    const next = !expanded
    setInner(next)
    onOpenChange?.(next)
  }

  const choose = (action: FloatAction) => {
    onSelect?.(action.key)
    setInner(false)
    onOpenChange?.(false)
  }

  const rootStyle = {
    [placement === 'bottom-left' ? 'left' : 'right']: `${offset}px`,
    bottom: `${offset}px`
  } as CSSProperties

  const classes = ['i-float', `i-float--${placement}`, expanded ? 'is-expanded' : '', className]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes} style={rootStyle}>
      {/* 动作在 DOM 里排在主按钮之前：Tab 到主按钮展开后，下一个焦点正好落在第一个动作上 */}
      {hasActions && (
        <ul className="i-float__actions" hidden={!expanded}>
          {actions.map((action, index) => (
            <li
              key={action.key}
              className="i-float__item"
              style={{
                // 几何走公共层：各端自己写间距的话，同一个组件在三端会错开几像素
                transform: `translateY(-${floatActionShift(index)}px)`,
                transitionDelay: `${floatActionDelay(index, actions.length)}ms`
              }}
            >
              <span className="i-float__label">{action.label}</span>
              <button
                className="i-float__action"
                type="button"
                tabIndex={expanded ? 0 : -1}
                onClick={() => choose(action)}
              >
                {action.icon ? (
                  <Icon name={action.icon as IconName} size={18} />
                ) : (
                  // 没给图标时用文字首字兜底，而不是留一个空圆
                  <span className="i-float__initial">{action.label.slice(0, 1)}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        className={['i-float__main', text ? '' : 'i-float__main--round'].filter(Boolean).join(' ')}
        type="button"
        aria-expanded={hasActions ? expanded : undefined}
        aria-label={text || '主操作'}
        onClick={toggle}
      >
        <Icon name={icon} size={22} />
        {text && <span className="i-float__text">{text}</span>}
      </button>
    </div>
  )
}
