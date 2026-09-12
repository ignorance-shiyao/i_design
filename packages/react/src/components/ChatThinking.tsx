import { useEffect, useState, type ReactNode } from 'react'
import {
  defaultOpenSteps,
  summarizeThinking,
  thinkingStepIcon,
  toggleThinkingStep,
  type ThinkingStep
} from '@i-design/common'
import { useConfig } from './ConfigProvider'
import { Icon } from './Icon'
import { Loading } from './Loading'

export interface ChatThinkingProps {
  /** 推理耗时的展示文案，如「思考了 12 秒」 */
  duration?: string
  label?: string
  /** 仍在推理中：标题旁的点持续呼吸 */
  pending?: boolean
  /** 初始是否展开；默认折叠——推理过程有用，但它不是答案 */
  defaultOpen?: boolean
  /**
   * 分步轨迹。给了就按步展示，每步可单独展开；
   * 不给则退回 children，仍是一整段文字。
   */
  steps?: ThinkingStep[]
  className?: string
  children?: ReactNode
}

export function ChatThinking({
  duration = '',
  label = '',
  pending = false,
  defaultOpen = false,
  steps = [],
  className = '',
  children
}: ChatThinkingProps) {
  /* 标题走字典：不传时用「推理过程」那一句，传了以传进来的为准 */
  const { locale } = useConfig()
  const resolvedLabel = label || locale.thinking
  // 推理结束后不自动展开：用户此时正在读答案，弹开一大段过程会把答案推走
  const [open, setOpen] = useState(defaultOpen)
  const [openSteps, setOpenSteps] = useState<string[]>(() => defaultOpenSteps(steps))

  const signature = steps.map((s) => `${s.key}:${s.status ?? 'done'}`).join()
  /* 步骤换了一批就重算默认展开：出错的那步是新出现的，用户此刻要看的正是它 */
  useEffect(() => {
    setOpenSteps(defaultOpenSteps(steps))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature])

  const summary = summarizeThinking(steps)
  /* 折叠时把进度顶在标题上：折叠不该连「走到第几步」一起藏掉 */
  const progress = summary.total ? `${summary.activeIndex + 1}/${summary.total}` : ''

  return (
    <section
      className={['i-chat-thinking', open ? 'is-open' : '', className].filter(Boolean).join(' ')}
    >
      <button className="i-chat-thinking__head" aria-expanded={open} onClick={() => setOpen(!open)}>
        {pending && <span className="i-chat-thinking__pulse" />}
        <Icon className="i-chat-thinking__arrow" name="chevron-right" size={14} />
        <span className="i-chat-thinking__label">{resolvedLabel}</span>
        {progress && <span className="i-chat-thinking__progress">{progress}</span>}
        {duration && <span className="i-chat-thinking__duration">{duration}</span>}
      </button>

      {open && (
        <div className="i-chat-thinking__body">
          {steps.length ? (
            <ol className="i-chat-thinking__steps">
              {steps.map((step) => {
                const stepOpen = openSteps.includes(step.key)
                return (
                  <li
                    key={step.key}
                    className={`i-chat-thinking__step i-chat-thinking__step--${step.status ?? 'done'}`}
                  >
                    <button
                      className="i-chat-thinking__step-head"
                      type="button"
                      aria-expanded={stepOpen}
                      disabled={!step.detail}
                      onClick={() => setOpenSteps(toggleThinkingStep(openSteps, step.key))}
                    >
                      <span className="i-chat-thinking__step-icon">
                        {step.status === 'running' ? (
                          <Loading size="sm" />
                        ) : (
                          <Icon name={thinkingStepIcon(step.kind)} size={13} />
                        )}
                      </span>
                      <span className="i-chat-thinking__step-title">{step.title}</span>
                      {step.detail && (
                        <Icon
                          className="i-chat-thinking__step-arrow"
                          name="chevron-right"
                          size={12}
                        />
                      )}
                    </button>
                    {step.detail && stepOpen && (
                      <p className="i-chat-thinking__step-detail">{step.detail}</p>
                    )}
                  </li>
                )
              })}
            </ol>
          ) : (
            children
          )}
        </div>
      )}
    </section>
  )
}
