/**
 * 命令式确认框的按钮编排与输入校验。
 *
 * 这两件事最容易各端各写一遍，而且写歪了没人会在构建时发现：
 * 一端「取消」在左、另一端在右，同一个产品里点错的人会怪自己手滑；
 * 校验规则不一致则更糟——一端拦下的输入在另一端提交成功了。
 */

export type ConfirmKind = 'confirm' | 'alert' | 'prompt'

/** 用户按了哪个键。close 表示按 Esc 或点遮罩关掉，与主动取消区分开 */
export type ConfirmRole = 'confirm' | 'cancel' | 'close'

export interface ConfirmAction {
  role: Exclude<ConfirmRole, 'close'>
  text: string
  /** 主按钮只有一个。破坏性确认把主按钮换成危险色，而不是加一行红字提醒 */
  primary: boolean
  danger: boolean
}

export interface ConfirmOptions {
  confirmText?: string
  cancelText?: string
  /** 破坏性操作：删除、清空、解绑这类做完撤不回来的 */
  danger?: boolean
}

/**
 * 按钮从左到右的顺序。
 *
 * 取消在左、确认在右：对话框是一条从左读到右的句子，确认是句尾的动作。
 * 反过来放的话，视线读完正文落在右边，右边却是「取消」——最容易点到的位置
 * 放的是放弃操作。
 *
 * alert 只有一个按钮，而且它的语义是「我知道了」不是「确认执行」：
 * 给它配一个「取消」会让人以为还有的选，实际上点哪个结果都一样。
 */
export function confirmActions(kind: ConfirmKind, options: ConfirmOptions = {}): ConfirmAction[] {
  const { confirmText = '确定', cancelText = '取消', danger = false } = options
  const ok: ConfirmAction = { role: 'confirm', text: confirmText, primary: true, danger }
  if (kind === 'alert') return [ok]
  return [{ role: 'cancel', text: cancelText, primary: false, danger: false }, ok]
}

export interface PromptRules {
  /** 不允许空值。只去掉首尾空白再判断，全是空格等于没填 */
  required?: boolean
  pattern?: RegExp
  /** 自定义校验，返回错误文案；通过时返回空串或 null */
  validate?: (value: string) => string | null
  requiredMessage?: string
  patternMessage?: string
}

/**
 * 校验输入框的值，返回错误文案；通过时返回 null。
 *
 * 顺序是必填 → 格式 → 自定义，一次只报一条。三条一起报会让用户先修下面那条、
 * 结果上面那条还在，看起来像改不动；而且自定义校验往往假设值已经非空。
 */
export function validatePromptValue(value: string, rules: PromptRules = {}): string | null {
  const trimmed = value.trim()
  if (rules.required && !trimmed) return rules.requiredMessage ?? '此项必填'
  if (rules.pattern && !rules.pattern.test(value)) return rules.patternMessage ?? '格式不正确'
  const custom = rules.validate?.(value)
  return custom ? custom : null
}

/**
 * 关掉对话框算不算「同意」。
 *
 * 一律不算：按 Esc、点遮罩、点右上角的叉，三种都是「我不想继续」。
 * 把关闭当成确认的话，一次误触就执行了删除。
 * alert 是唯一的例外——它只有一个结果，关掉与点「我知道了」等价。
 */
export function isConfirmed(kind: ConfirmKind, role: ConfirmRole): boolean {
  if (kind === 'alert') return true
  return role === 'confirm'
}
