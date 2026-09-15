import { useEffect, useState, type ReactNode } from 'react'
import {
  leaveGuard,
  resetLabel,
  resetValues,
  submitGate,
  type ResetScope,
  type SubmitPhase
} from '@i-design/common'
import { Icon } from './Icon'
import { Button } from './Button'

export interface FormPageProps {
  title: string
  description?: string
  /** 当前表单值。受控：壳不自己存 */
  values: Record<string, unknown>
  /** 打开这张表时的样子。编辑态下就是原始数据，新建态是空对象 */
  initial?: Record<string, unknown>
  /** 上次存下的草稿。给了之后「重置」才有「回到草稿」这一档 */
  draft?: Record<string, unknown>
  phase?: SubmitPhase
  /** 表单自身校验通过了吗。由里面的表单告诉壳 */
  valid?: boolean
  disabled?: boolean
  /** 提交成功之后还允许再提交吗。默认不允许——成功了就该走开了 */
  resubmittable?: boolean
  resetScope?: ResetScope
  submitText?: string
  cancelText?: string
  resettable?: boolean
  extra?: ReactNode
  children?: ReactNode
  onValuesChange?: (values: Record<string, unknown>) => void
  onSubmit?: (values: Record<string, unknown>) => void
  /** 用户确认要走了。离开保护已经问过，调用方直接走即可 */
  onCancel?: () => void
  onReset?: (values: Record<string, unknown>) => void
  className?: string
}

/**
 * 整页表单的壳（astra.md 的 B09）。
 *
 * 它不管字段怎么渲染，管的是围着表单的那几件事：重复提交拦不拦、
 * 现在为什么不能提交、改了几项没保存、点「取消」要不要先问一句。
 * 判断全在 logic/formhost.ts，五端共用一份。
 */
export function FormPage({
  title,
  description = '',
  values,
  initial = {},
  draft,
  phase = 'idle',
  valid = true,
  disabled = false,
  resubmittable = false,
  resetScope = 'initial',
  submitText = '提交',
  cancelText = '取消',
  resettable = true,
  extra,
  children,
  onValuesChange,
  onSubmit,
  onCancel,
  onReset,
  className = ''
}: FormPageProps) {
  const gate = submitGate({ phase, valid, disabled, resubmittable })
  const guard = leaveGuard({ base: initial, current: values, phase, draftSaved: draft !== undefined })
  const resetText = resetLabel(resetScope, draft !== undefined)

  const [asking, setAsking] = useState(false)
  // 表单一改动，之前那次「确定要走吗」就不作数了
  useEffect(() => setAsking(false), [values])

  /*
   * 只有「还拦着」的时候才把确认条摆出来。不加这一道的话，正在提交时它会留在
   * 屏幕上、而问题本身变成空串——leaveGuard 在提交中本来就不拦，message 是空的。
   */
  const confirming = asking && guard.blocked

  /*
   * 底部那句话优先说「为什么不能提交」，没话说的时候才说「有几项没保存」。
   * 反过来的话，正在提交时显示的是「有 3 项未保存」，读起来像是没交上去。
   */
  const status = gate.reason || (guard.blocked ? guard.message.replace('，确定离开吗？', '') : '')

  const handleReset = () => {
    const next = resetValues(resetScope, initial, draft)
    onValuesChange?.(next)
    onReset?.(next)
  }

  return (
    <section className={['i-form-page', className].filter(Boolean).join(' ')}>
      <header className="i-form-page__head">
        <div>
          <h2 className="i-form-page__title">{title}</h2>
          {description && <p className="i-form-page__desc">{description}</p>}
        </div>
        {extra}
      </header>

      <div className="i-form-page__body">{children}</div>

      {/*
        离开确认就地展开：用户点的是底部的「取消」，答案就该出现在他手指所在的地方。
      */}
      {confirming && (
        <div className="i-form-page__confirm" role="alertdialog" aria-label={guard.message}>
          <span className="i-form-page__confirm-icon">
            <Icon name="warning-triangle" size={14} />
          </span>
          <span className="i-form-page__confirm-text">{guard.message}</span>
          <Button size="sm" onClick={() => setAsking(false)}>
            继续编辑
          </Button>
          <Button size="sm" variant="danger" onClick={onCancel}>
            放弃修改并离开
          </Button>
        </div>
      )}

      <footer className="i-form-page__foot">
        {/* 只把按钮置灰而不说原因，用户只会反复点它 */}
        <p className={`i-form-page__status${gate.reason ? ' is-blocked' : ''}`}>{status}</p>
        <div className="i-form-page__actions">
          <Button size="sm" onClick={() => (guard.blocked ? setAsking(true) : onCancel?.())}>
            {cancelText}
          </Button>
          {resettable && (
            <Button size="sm" disabled={gate.busy} onClick={handleReset}>
              {resetText}
            </Button>
          )}
          <Button
            size="sm"
            variant="primary"
            loading={gate.busy}
            disabled={!gate.allowed}
            onClick={() => onSubmit?.(values)}
          >
            {submitText}
          </Button>
        </div>
      </footer>
    </section>
  )
}
