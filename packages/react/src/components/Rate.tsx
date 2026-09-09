import { useState, type MouseEvent } from 'react'
import { Icon } from './Icon'

export interface RateProps {
  value?: number
  count?: number
  /** 允许半星 */
  half?: boolean
  readOnly?: boolean
  disabled?: boolean
  /** 右侧文案，如「4.5 分」 */
  text?: string
  size?: number
  onChange?: (value: number) => void
  className?: string
}

export function Rate({
  value = 0,
  count = 5,
  half = false,
  readOnly = false,
  disabled = false,
  text = '',
  size = 18,
  onChange,
  className = ''
}: RateProps) {
  // 悬停时预览分值；移开后回到实际值
  const [hover, setHover] = useState(0)
  const shown = hover || value
  const interactive = !readOnly && !disabled

  function valueAt(index: number, event: MouseEvent<HTMLButtonElement>) {
    if (!half) return index + 1
    const rect = event.currentTarget.getBoundingClientRect()
    // 落在左半边即为半星
    return event.clientX - rect.left < rect.width / 2 ? index + 0.5 : index + 1
  }

  return (
    <div
      className={['i-rate', disabled ? 'is-disabled' : '', className].filter(Boolean).join(' ')}
      role="slider"
      aria-valuemin={0}
      aria-valuemax={count}
      aria-valuenow={value}
      onMouseLeave={() => setHover(0)}
    >
      {Array.from({ length: count }, (_, i) => i + 1).map((index) => (
        <button
          key={index}
          type="button"
          className={[
            'i-rate__item',
            shown >= index ? 'is-on' : '',
            !interactive ? 'is-readonly' : ''
          ]
            .filter(Boolean)
            .join(' ')}
          disabled={disabled}
          aria-label={`${index} 分`}
          onMouseMove={(e) => interactive && setHover(valueAt(index - 1, e))}
          onClick={(e) => {
            if (!interactive) return
            const next = valueAt(index - 1, e)
            // 再点一次同一个值即清零，这是评分组件的通行做法
            onChange?.(next === value ? 0 : next)
          }}
        >
          <Icon name="sparkle" size={size} />
          {half && shown >= index - 0.5 && shown < index && (
            <span className="i-rate__half" aria-hidden="true">
              <Icon name="sparkle" size={size} />
            </span>
          )}
        </button>
      ))}
      {text && <span className="i-rate__text">{text}</span>}
    </div>
  )
}
