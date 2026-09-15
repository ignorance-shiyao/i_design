import { useEffect, useMemo, useState } from 'react'
import { useConfig } from './ConfigProvider'
import {
  approvalGate,
  approvalProgress,
  canAdvance,
  elapsedInterval,
  toggleApprovalValue,
  type ApprovalAnswer,
  type ApprovalQuestion
} from '@i-design/common'
import { Icon } from './Icon'
import { Button } from './Button'

export interface ApprovalCardProps {
  /** 一组问题，逐题回答；只有一题时不显示分页 */
  questions: ApprovalQuestion[]
  /**
   * 过期时刻（毫秒时间戳）。不给表示这条确认不过期。
   *
   * 这张卡片会在屏幕上待很久——人去开了个会、切走看别的。回来时那个动作
   * 可能已经不该再执行了，而卡片长得和刚发出来时一模一样：按钮还亮着。
   */
  expiresAt?: number
  /** 这条确认是针对哪个版本发出的 */
  version?: number
  /** 被确认的东西现在是第几版。与 version 不同就说明前提变了 */
  currentVersion?: number
  confirmText?: string
  skipText?: string
  renewText?: string
  reviewText?: string
  closable?: boolean
  /** 全部答完后一次性给出，键为问题 id */
  onComplete?: (answers: Record<string, ApprovalAnswer>) => void
  /** 过期了：请调用方重新发起同一次确认 */
  onRenew?: () => void
  /** 版本变了：请调用方把新版本摊开给人看，而不是续期旧的 */
  onReview?: () => void
  onClose?: () => void
}

export function ApprovalCard({
  questions,
  expiresAt,
  version,
  currentVersion,
  confirmText = '',
  skipText = '',
  renewText = '重新发起',
  reviewText = '查看新版本',
  closable = true,
  onComplete,
  onRenew,
  onReview,
  onClose
}: ApprovalCardProps) {
  /* 「继续」「跳过」「下一题」「其他」都走字典；组件自己传了以传进来的为准 */
  const { locale } = useConfig()
  const resolvedConfirm = confirmText || locale.confirm
  const resolvedSkip = skipText || locale.skip
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<string[]>([])
  const [custom, setCustom] = useState('')
  const [answers, setAnswers] = useState<Record<string, ApprovalAnswer>>({})

  /*
   * 自己走的时钟，只为倒计时。交给使用方传「还剩几秒」等于要求每个页面
   * 自己开一个定时器，而且各家的进位还会不一样。
   */
  const [now, setNow] = useState(() => Date.now())
  const gate = approvalGate({ expiresAt, version, currentVersion, now })
  useEffect(() => {
    // 只在还剩时间时走表：过期或版本失效之后再跳，除了耗电什么也不做
    if (gate.state !== 'expiring') return
    const id = setTimeout(() => setNow(Date.now()), elapsedInterval(Date.now()))
    return () => clearTimeout(id)
  }, [gate.state, now])

  const current = questions[index]
  const total = questions.length
  const isLast = index === total - 1
  // 不能拍板时连「下一题」都停掉：翻到最后一题再发现按钮是灰的更让人恼火
  const advanceable = useMemo(
    () => (gate.decidable && current ? canAdvance(current, selected, custom) : false),
    [gate.decidable, current, selected, custom]
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

      {/*
        失效说明放在选项上方而不是按钮旁边：读者是先看选项再看按钮的，
        放在下面等于让他把一遍选项白读了。
      */}
      {gate.state !== 'open' && (
        <div className={`i-approval__gate i-approval__gate--${gate.state}`} role="status">
          <span className="i-approval__gate-icon">
            <Icon name={gate.state === 'stale' ? 'history' : 'clock'} size={14} />
          </span>
          <span className="i-approval__gate-text">
            <strong>{gate.label}</strong>
            {gate.detail}
          </span>
          {gate.action === 'renew' && (
            <Button size="sm" className="i-approval__gate-action" onClick={onRenew}>
              {renewText}
            </Button>
          )}
          {gate.action === 'review' && (
            <Button size="sm" className="i-approval__gate-action" onClick={onReview}>
              {reviewText}
            </Button>
          )}
        </div>
      )}

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
              disabled={!gate.decidable}
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
          disabled={!gate.decidable}
          placeholder={current.customPlaceholder ?? `${locale.otherOption}……`}
          aria-label={current.customPlaceholder ?? locale.otherOption}
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
              aria-label={locale.next}
              disabled={isLast || !advanceable}
              onClick={() => commit({ values: [...selected], custom: custom.trim() || undefined })}
            >
              <Icon name="chevron-down" size={14} />
            </button>
          </div>
        )}

        <div className="i-approval__actions">
          {current.skippable && (
            <Button size="sm" disabled={!gate.decidable} onClick={() => commit({ skipped: true })}>
              {resolvedSkip}
            </Button>
          )}
          <Button
            size="sm"
            variant="primary"
            disabled={!advanceable}
            onClick={() => commit({ values: [...selected], custom: custom.trim() || undefined })}
          >
            {isLast ? resolvedConfirm : locale.next}
          </Button>
        </div>
      </footer>
    </section>
  )
}
