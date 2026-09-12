import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  confirmActions,
  isConfirmed,
  validatePromptValue,
  type ConfirmKind,
  type ConfirmRole,
  type PromptRules
} from '@i-design/common'
import { Modal } from './Modal'
import { Button } from './Button'
import { Input } from './Input'

export interface ConfirmBoxOptions {
  title?: string
  content?: string
  confirmText?: string
  cancelText?: string
  /** 破坏性操作：删除、清空、解绑这类做完撤不回来的 */
  danger?: boolean
  /** 点遮罩是否关闭。破坏性确认默认关掉，免得一次误触就走完流程 */
  maskClosable?: boolean
}

export interface PromptOptions extends ConfirmBoxOptions, PromptRules {
  placeholder?: string
  defaultValue?: string
}

interface ConfirmRecord {
  id: number
  kind: ConfirmKind
  title: string
  content: string
  confirmText: string
  cancelText: string
  danger: boolean
  maskClosable: boolean
  placeholder: string
  defaultValue: string
  rules: PromptRules
  settle: (role: ConfirmRole, value: string) => void
}

let seed = 0
let emit: ((records: ConfirmRecord[]) => void) | null = null
let records: ConfirmRecord[] = []
let mounted = false

function sync() {
  emit?.([...records])
}

function drop(id: number) {
  records = records.filter((c) => c.id !== id)
  sync()
}

/** 首次调用才挂载容器，未用到对话框的页面不会多出 DOM 节点 */
function ensureHost() {
  if (mounted || typeof document === 'undefined') return
  mounted = true
  const el = document.createElement('div')
  document.body.appendChild(el)
  createRoot(el).render(<ConfirmHost />)
}

function open(kind: ConfirmKind, options: PromptOptions): Promise<string> {
  ensureHost()
  return new Promise<string>((resolve, reject) => {
    const id = ++seed
    records = [
      ...records,
      {
        id,
        kind,
        title: options.title ?? '',
        content: options.content ?? '',
        confirmText: options.confirmText ?? (kind === 'alert' ? '知道了' : '确定'),
        cancelText: options.cancelText ?? '取消',
        danger: options.danger ?? false,
        // 破坏性确认默认不允许点遮罩关闭：那一下太容易误触，而它旁边就是「确定」
        maskClosable: options.maskClosable ?? !options.danger,
        placeholder: options.placeholder ?? '',
        defaultValue: options.defaultValue ?? '',
        rules: {
          required: options.required,
          pattern: options.pattern,
          validate: options.validate,
          requiredMessage: options.requiredMessage,
          patternMessage: options.patternMessage
        },
        settle(role, value) {
          if (isConfirmed(kind, role)) resolve(value)
          // 取消走 reject 而不是 resolve(false)：调用方写 await 之后
          // 后面那几行就是「用户同意了才做的事」，不该再缩进一层 if
          else reject(new Error('cancelled'))
        }
      }
    ]
    sync()
  })
}

/**
 * 命令式对话框。
 *
 * 取消走 reject：`await confirm.confirm(...)` 之后的代码就是「用户同意了才跑的」，
 * 不必再包一层判断。不想处理拒绝时用 `.catch(() => {})` 一笔带过。
 */
export const confirm = {
  /** 二选一。用户取消时 Promise 被拒绝 */
  confirm: (options: ConfirmBoxOptions) => open('confirm', options).then(() => true),
  /** 只有一个「知道了」。关掉与点按钮等价，所以永远 resolve */
  alert: (options: ConfirmBoxOptions) => open('alert', options).then(() => true),
  /** 带输入框。resolve 的是输入的值；校验不过不会关闭 */
  prompt: (options: PromptOptions) => open('prompt', options)
}

function ConfirmHost() {
  const [list, setList] = useState<ConfirmRecord[]>([])
  /* 每条记录自己一份输入值与错误：连着弹两个 prompt 时共用一份会带出残值 */
  const [values, setValues] = useState<Record<number, string>>({})
  const [errors, setErrors] = useState<Record<number, string>>({})

  useEffect(() => {
    emit = setList
    setList([...records])
    return () => {
      emit = null
    }
  }, [])

  const settle = (item: ConfirmRecord, role: ConfirmRole) => {
    const value = values[item.id] ?? item.defaultValue
    if (item.kind === 'prompt' && role === 'confirm') {
      const error = validatePromptValue(value, item.rules)
      if (error) {
        setErrors((prev) => ({ ...prev, [item.id]: error }))
        return
      }
    }
    item.settle(role, value)
    drop(item.id)
    setValues(({ [item.id]: _drop, ...rest }) => rest)
    setErrors(({ [item.id]: _dropped, ...rest }) => rest)
  }

  return (
    <>
      {list.map((item) => (
        <Modal
          key={item.id}
          open
          title={item.title}
          width="420px"
          maskClosable={item.maskClosable}
          onClose={() => settle(item, 'close')}
          footer={confirmActions(item.kind, {
            confirmText: item.confirmText,
            cancelText: item.cancelText,
            danger: item.danger
          }).map((action) => (
            <Button
              key={action.role}
              variant={action.primary ? (action.danger ? 'danger' : 'primary') : 'secondary'}
              onClick={() => settle(item, action.role)}
            >
              {action.text}
            </Button>
          ))}
        >
          {item.content && <p className="i-confirm__text">{item.content}</p>}
          {item.kind === 'prompt' && (
            <div className="i-confirm__field">
              <Input
                value={values[item.id] ?? item.defaultValue}
                placeholder={item.placeholder}
                invalid={Boolean(errors[item.id])}
                onChange={(next: string) => {
                  setValues((prev) => ({ ...prev, [item.id]: next }))
                  /* 改了就把错误清掉：留着旧错误会让人以为改了也没用 */
                  if (errors[item.id]) setErrors(({ [item.id]: _gone, ...rest }) => rest)
                }}
              />
              {errors[item.id] && <p className="i-confirm__error">{errors[item.id]}</p>}
            </div>
          )}
        </Modal>
      ))}
    </>
  )
}
