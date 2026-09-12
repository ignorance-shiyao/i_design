import { zhCN, type Locale } from '@i-design/common'

/**
 * 给「挂在 body 上」的那几层用的字典。
 *
 * message()、confirm()、notification() 的宿主是命令式 API 自己 createRoot 出来的，
 * 挂在 document.body 下面，根本不在 React 树里——context 到不了那里。
 * ConfigProvider 在解析出字典时顺手写一份到这里，那几层再从这里读。
 *
 * 嵌套多个 Provider 时这里存的是「最后渲染的那一个」。对树内组件没有影响
 * （它们走 context，内层照样覆盖外层）；而对树外的浮层来说，
 * 本来就不存在「它属于哪一层」这个问题——它属于整个页面。
 */
let current: Locale = zhCN
const listeners = new Set<() => void>()

export function setBridgedLocale(locale: Locale) {
  if (locale === current) return
  current = locale
  for (const notify of listeners) notify()
}

export function bridgedLocale(): Locale {
  return current
}

/** 给 useSyncExternalStore 用：浮层要跟着字典变，而不是停在第一次渲染的那份 */
export function subscribeBridgedLocale(notify: () => void) {
  listeners.add(notify)
  return () => listeners.delete(notify)
}
