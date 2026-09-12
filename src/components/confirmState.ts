import { ref } from 'vue'
import type { ConfirmKind, ConfirmRole, PromptRules } from '@i-design/common'

export interface ConfirmRecord {
  id: number
  kind: ConfirmKind
  title: string
  content: string
  confirmText: string
  cancelText: string
  danger: boolean
  maskClosable: boolean
  /** prompt 专用 */
  placeholder: string
  defaultValue: string
  rules: PromptRules
  settle: (role: ConfirmRole, value: string) => void
}

/**
 * 对话框队列的单一数据源。
 * 与 messageState 同样的理由：命令式 API 与渲染组件共享一个 ref 而不互相 import。
 *
 * 用队列而不是单个值：确认框常常出现在「提交失败 → 再问一次」这类连锁里，
 * 只留一个的话后来的会把前一个顶掉，而前一个的 Promise 永远不 settle。
 */
export const confirms = ref<ConfirmRecord[]>([])

export function dropConfirm(id: number) {
  confirms.value = confirms.value.filter((c) => c.id !== id)
}
