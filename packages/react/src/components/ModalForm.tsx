import { useEffect, useState, type ReactNode } from 'react'
import {
  leaveGuard,
  resetLabel,
  resetValues,
  submitGate,
  type ResetScope,
  type SubmitPhase
} from '@i-design/common'
import { Modal } from './Modal'
import { Icon } from './Icon'
import { Button } from './Button'

export interface ModalFormProps {
  /** 弹窗开关 */
  open?: boolean
  title?: string
  width?: string
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
  resubmittable?: boolean
  resetScope?: ResetScope
  submitText?: string
  cancelText?: string
  resettable?: boolean
  children?: ReactNode
  onOpenChange?: (open: boolean) => void
  onValuesChange?: (values: Record<string, unknown>) => void
  onSubmit?: (values: Record<string, unknown>) => void
  /** 用户确认要走了。离开保护已经问过，调用方直接关即可 */
  onCancel?: () => void
  onReset?: (values: Record<string, unknown>) => void
}

/**
 * 弹窗里的表单壳（astra.md 的 B09）。
 *
 * 与 FormPage 是同一套判断（logic/formhost.ts），换了个容器。浮层多出来的
 * 那件事是：关闭这个动作本身要被离开保护拦住——点遮罩、按 Esc、点右上角的叉，
 * 在改了一半的表单上都等于「放弃刚才填的东西」。
 */
export function ModalForm({
  open = false,
  title = '',
  width = '480px',
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
  children,
  onOpenChange,
  onValuesChange,
  onSubmit,
  onCancel,
  onReset
}: ModalFormProps) {
  const gate = submitGate({ phase, valid, disabled, resubmittable })
  const guard = leaveGuard({ base: initial, current: values, phase, draftSaved: draft !== undefined })
  const resetText = resetLabel(resetScope, draft !== undefined)

  const [asking, setAsking] = useState(false)
  useEffect(() => setAsking(false), [values])
  // 只有还拦着的时候才摆出来：提交中 leaveGuard 本来就不拦，message 是空的
  const confirming = asking && guard.blocked

  /*
   * 优先说「为什么不能提交」，没话说的时候才说「有几项没保存」。
   * 反过来的话，正在提交时显示的是「有 3 项未保存」，读起来像是没交上去。
   */
  const status = gate.reason || (guard.blocked ? guard.message.replace('，确定离开吗？', '') : '')

  const leave = () => {
    setAsking(false)
    onOpenChange?.(false)
    onCancel?.()
  }

  /** Modal 的关闭（遮罩、Esc、右上角的叉）都走这里，先问一句再关 */
  const requestClose = () => (guard.blocked ? setAsking(true) : leave())

  return (
    <Modal
      open={open}
      title={title}
      width={width}
      onClose={requestClose}
      footer={
        <div className="i-form-overlay__foot">
          {/* 确认就地展开在按钮上方，而不是再叠一层对话框 */}
          {confirming && (
            <div className="i-form-confirm" role="alertdialog" aria-label={guard.message}>
              <span className="i-form-confirm__icon">
                <Icon name="warning-triangle" size={14} />
              </span>
              <span className="i-form-confirm__text">{guard.message}</span>
              <Button size="sm" onClick={() => setAsking(false)}>
                继续编辑
              </Button>
              <Button size="sm" variant="danger" onClick={leave}>
                放弃修改并离开
              </Button>
            </div>
          )}

          <div className="i-form-bar">
            {/* 只把按钮置灰而不说原因，用户只会反复点它 */}
            <p className={`i-form-bar__status${gate.reason ? ' is-blocked' : ''}`}>{status}</p>
            <div className="i-form-bar__actions">
              <Button size="sm" onClick={requestClose}>
                {cancelText}
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
          </div>
        </div>
      }
    >
      <div className="i-form-overlay__body">{children}</div>
    </Modal>
  )
}
