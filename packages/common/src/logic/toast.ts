/** Toast 的排队与超时规则，各端只负责渲染 */
export interface ToastRecord {
  id: number
  content: string
  type: 'text' | 'success' | 'warning' | 'error' | 'loading'
  duration: number
}

let seed = 0
export const nextToastId = () => ++seed

/** loading 型 Toast 不自动消失，必须由调用方关闭——否则会永远盖住界面 */
export function resolveDuration(type: ToastRecord['type'], duration?: number) {
  if (duration !== undefined) return duration
  return type === 'loading' ? 0 : 2000
}
