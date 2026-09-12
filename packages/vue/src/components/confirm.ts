import { createApp, type App } from 'vue'
import { isConfirmed, type ConfirmKind, type PromptRules } from '@i-design/common'
import IConfirmLayer from './IConfirmLayer.vue'
import { confirms } from './confirmState'

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

export interface PromptResult {
  value: string
}

let seed = 0
let host: App | null = null

/** 首次调用时才挂载容器，未用到对话框的页面不会多出 DOM 节点 */
function ensureHost() {
  if (host || typeof document === 'undefined') return
  const el = document.createElement('div')
  document.body.appendChild(el)
  host = createApp(IConfirmLayer)
  host.mount(el)
}

function open(kind: ConfirmKind, options: PromptOptions): Promise<string> {
  ensureHost()
  return new Promise<string>((resolve, reject) => {
    const id = ++seed
    confirms.value = [
      ...confirms.value,
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
  })
}

/**
 * 命令式对话框。
 *
 * 取消走 reject：`await confirm(...)` 之后的代码就是「用户同意了才跑的」，
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
