import { useMemo, useState } from 'react'
import {
  approvalProgress,
  canAdvance,
  toggleApprovalValue,
  type ApprovalAnswer,
  type ApprovalQuestion
} from '@i-design/common'
import { Icon } from './Icon'
import { Button } from './Button'

export interface ApprovalCardProps {
  /** 一组问题，逐题回答；只有一题时不显示分页 */
  questions: ApprovalQuestion[]
  confirmText?: string
  skipText?: string
  closable?: boolean
  /** 全部答完后一次性给出，键为问题 id */
  onComplete?: (answers: Record<string, ApprovalAnswer>) => void
  onClose?: () => void
}

export function ApprovalCard({
  questions,
  confirmText = '继续',
  skipText = '跳过',
  closable = true,
  onComplete,
  onClose
}: ApprovalCardProps) {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<string[]>([])
  const [custom, setCustom] = useState('')
  const [answers, setAnswers] = useState<Record<string, ApprovalAnswer>>({})

  const current = questions[index]
  const total = questions.length
  const isLast = index === total - 1
  const advanceable = useMemo(
    () => (current ? canAdvance(current, selected, custom) : false),
    [current, selected, custom]
  )

  // 回退时取回上一题的作答，用户往回翻不该看到空白
  const goTo = (next: number) => {
    const saved = answers[questions[next]?.id ?? '']
    if (saved && !('skipped' in saved)) {
      setSelected([...saved.values])
      setCustom(saved.custom ?? '')
    } else {
      setSelected([])
      setCustom('')
    }
    setIndex(next)
  }

  const commit = (answer: ApprovalAnswer) => {
    if (!current) return
    const merged = { ...answers, [current.id]: answer }
    setAnswers(merged)
    if (isLast) onComplete?.(merged)
    else goTo(index + 1)
  }

  if (!current) return null

  return (
    <section className="i-agent-card i-approval" role="group" aria-label={current.title}>
      <header className="i-approval__head">
        <p className="i-approval__title">{current.title}</p>
        {closable && (
          <button className="i-approval__nav" aria-label="关闭" onClick={onClose}>
            <Icon name="close" size={14} />
          </button>
        )}
      </header>

      <div className="i-approval__options" role={current.multiple ? 'group' : 'radiogroup'}>
        {current.options.map((option) => {
          const on = selected.includes(option.value)
          return (
            <button
              key={option.value}
              type="button"
              className={`i-approval__option${on ? ' is-selected' : ''}`}
              role={current.multiple ? 'checkbox' : 'radio'}
              aria-checked={on}
              onClick={() => setSelected(toggleApprovalValue(current, selected, option.value))}
            >
              <Icon
                name={on ? 'check-circle' : current.multiple ? 'plus' : 'info-circle'}
                size={16}
              />
              <span>{option.label}</span>
              {option.hint && <span className="i-approval__hint">{option.hint}</span>}
            </button>
          )
        })}
      </div>

      {/* 自由输入：预设选项之外总有第三种答案，不给出口只会逼用户随便选一个 */}
      {current.allowCustom && (
        <input
          className="i-approval__custom"
          value={custom}
          placeholder={current.customPlaceholder ?? '其他……'}
          aria-label={current.customPlaceholder ?? '其他'}
          onChange={(e) => setCustom(e.target.value)}
        />
      )}

      <footer className="i-approval__foot">
        {total > 1 && (
          <div className="i-approval__progress">
            <button
              className="i-approval__nav"
              aria-label="上一题"
              disabled={index === 0}
              onClick={() => goTo(index - 1)}
            >
              <Icon name="chevron-up" size={14} />
            </button>
            {approvalProgress(index, total)}
            <button
              className="i-approval__nav"
              aria-label="下一题"
              disabled={isLast || !advanceable}
              onClick={() => commit({ values: [...selected], custom: custom.trim() || undefined })}
            >
              <Icon name="chevron-down" size={14} />
            </button>
          </div>
        )}

        <div className="i-approval__actions">
          {current.skippable && (
            <Button size="sm" onClick={() => commit({ skipped: true })}>
              {skipText}
            </Button>
          )}
          <Button
            size="sm"
            variant="primary"
            disabled={!advanceable}
            onClick={() => commit({ values: [...selected], custom: custom.trim() || undefined })}
          >
            {isLast ? confirmText : '下一题'}
          </Button>
        </div>
      </footer>
    </section>
  )
}
