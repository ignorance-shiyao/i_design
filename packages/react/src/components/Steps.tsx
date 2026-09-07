import { Icon } from './Icon'

export interface StepItem {
  title: string
  description?: string
}

export interface StepsProps {
  items: StepItem[]
  current?: number
  direction?: 'horizontal' | 'vertical'
  status?: 'process' | 'error'
  /** 只允许回到已完成的步骤，避免跳过尚未填写的表单 */
  clickable?: boolean
  onChange?: (index: number) => void
}

export function Steps({
  items,
  current = 0,
  direction = 'horizontal',
  status = 'process',
  clickable = false,
  onChange
}: StepsProps) {
  const stateOf = (index: number) =>
    index < current ? 'finish' : index > current ? 'wait' : status === 'error' ? 'error' : 'process'

  return (
    <ol className={['i-steps', `i-steps--${direction}`, clickable ? 'is-clickable' : ''].filter(Boolean).join(' ')}>
      {items.map((item, index) => {
        const state = stateOf(index)
        return (
          <li
            key={item.title}
            className={`i-step is-${state}`}
            aria-current={index === current ? 'step' : undefined}
            onClick={() => clickable && index < current && onChange?.(index)}
          >
            <div className="i-step__head">
              <span className="i-step__icon">
                {state === 'finish' ? (
                  <Icon name="check" size={14} strokeWidth={2.4} />
                ) : state === 'error' ? (
                  <Icon name="close" size={14} strokeWidth={2.4} />
                ) : (
                  index + 1
                )}
              </span>
              {index < items.length - 1 && <span className="i-step__line" aria-hidden="true" />}
            </div>
            <div className="i-step__body">
              <p className="i-step__title">{item.title}</p>
              {item.description && <p className="i-step__desc">{item.description}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
