import { useEffect, useState, type ReactNode } from 'react'
import {
  resetLabel,
  resetValues,
  stepOfError,
  stepState,
  submitGate,
  type ResetScope,
  type StepSpec,
  type SubmitPhase
} from '@i-design/common'
import { Icon } from './Icon'
import { Button } from './Button'

export interface StepFormProps {
  steps: StepSpec[]
  /** 当前表单值。受控：壳不自己存，所以往回翻天然不丢 */
  values: Record<string, unknown>
  initial?: Record<string, unknown>
  draft?: Record<string, unknown>
  /** 当前所有字段的错误路径，由里面的表单或服务端给 */
  errorPaths?: string[]
  phase?: SubmitPhase
  disabled?: boolean
  resubmittable?: boolean
  resetScope?: ResetScope
  submitText?: string
  resettable?: boolean
  /** Vue 端每一步一个具名插槽，React 没有插槽，只能用渲染函数 */
  renderStep?: (step: StepSpec, index: number) => ReactNode
  onValuesChange?: (values: Record<string, unknown>) => void
  onSubmit?: (values: Record<string, unknown>) => void
  /** 换步时抛出下标与那一步的 key，便于调用方按需拉数据 */
  onStepChange?: (index: number, key: string) => void
  onReset?: (values: Record<string, unknown>) => void
  className?: string
}

/**
 * 分步表单的壳（astra.md 的 B09）。
 *
 * 值由调用方持有，这个壳一个字都不存，所以返回上一步天然不丢数据；
 * 能不能往下走只看这一步自己的字段；提交失败跳回出错的那一步。
 * 判断在 logic/formhost.ts，五端共用一份。
 */
export function StepForm({
  steps,
  values,
  initial = {},
  draft,
  errorPaths = [],
  phase = 'idle',
  disabled = false,
  resubmittable = false,
  resetScope = 'initial',
  submitText = '提交',
  resettable = true,
  renderStep,
  onValuesChange,
  onSubmit,
  onStepChange,
  onReset,
  className = ''
}: StepFormProps) {
  const [index, setIndex] = useState(0)
  /** 走过哪些步。没走到过的不标红——那说的是「还没填」，不是「填错了」 */
  const [visited, setVisited] = useState<number[]>([0])

  const state = stepState({ steps, index, errorPaths, visited })
  const gate = submitGate({
    phase,
    // 最后一步的提交要求整张表没有错，不只是这一步
    valid: errorPaths.length === 0,
    disabled,
    resubmittable
  })

  const go = (next: number) => {
    if (next < 0 || next >= steps.length) return
    setIndex(next)
    setVisited((prev) => (prev.includes(next) ? prev : [...prev, next]))
    onStepChange?.(next, steps[next]?.key ?? '')
  }

  /*
   * 提交失败之后跳回出错的那一步。只在 failed 那一刻跳一次：
   * 每次错误变化都跳的话，用户在第一步改字时会被第三步的错误拽走。
   */
  useEffect(() => {
    if (phase !== 'failed') return
    const target = stepOfError(steps, errorPaths)
    if (target >= 0 && target !== index) go(target)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const status = state.blocked
    ? '这一步还有字段没填对'
    : gate.reason && state.isLast
      ? gate.reason
      : ''

  return (
    <section className={['i-step-form', className].filter(Boolean).join(' ')}>
      {/* 步骤条：形状 + 淡底色块 + 文字三重表达，颜色不单独承担「哪一步错了」 */}
      <ol className="i-step-form__marks">
        {state.marks.map((mark, i) => (
          <li
            key={mark.key}
            className={`i-step-form__mark is-${mark.state}`}
            aria-current={mark.state === 'current' ? 'step' : undefined}
          >
            <span className="i-step-form__mark-icon">
              {mark.state === 'done' ? (
                <Icon name="check" size={12} />
              ) : mark.state === 'error' ? (
                <Icon name="warning-triangle" size={12} />
              ) : (
                i + 1
              )}
            </span>
            <span>{mark.title}</span>
            {mark.state === 'error' && <span className="i-step-form__mark-note">有错</span>}
          </li>
        ))}
      </ol>

      <div className="i-step-form__body">{renderStep?.(steps[index], index)}</div>

      <div className="i-form-bar">
        {/* 只把按钮置灰而不说原因，用户只会反复点它 */}
        <p className={`i-form-bar__status${status ? ' is-blocked' : ''}`}>{status}</p>
        <div className="i-form-bar__actions">
          <Button size="sm" disabled={!state.canPrev} onClick={() => go(index - 1)}>
            上一步
          </Button>
          {resettable && (
            <Button
              size="sm"
              disabled={gate.busy}
              onClick={() => {
                const next = resetValues(resetScope, initial, draft)
                onValuesChange?.(next)
                onReset?.(next)
              }}
            >
              {resetLabel(resetScope, draft !== undefined)}
            </Button>
          )}
          {!state.isLast ? (
            <Button
              size="sm"
              variant="primary"
              disabled={!state.canNext}
              onClick={() => go(index + 1)}
            >
              下一步
            </Button>
          ) : (
            <Button
              size="sm"
              variant="primary"
              loading={gate.busy}
              disabled={!gate.allowed}
              onClick={() => onSubmit?.(values)}
            >
              {submitText}
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}
