import { createApp, ref, type App } from 'vue'
import { nextToastId, resolveDuration, type ToastRecord } from '@i-design/common'
import IToast from './components/IToast.vue'

/** 当前展示的 Toast；移动端一次只显示一条，新的会顶掉旧的 */
export const currentToast = ref<ToastRecord | null>(null)

let host: App | null = null
let timer: ReturnType<typeof setTimeout> | undefined

function ensureHost() {
  if (host || typeof document === 'undefined') return
  const el = document.createElement('div')
  document.body.appendChild(el)
  host = createApp(IToast)
  host.mount(el)
}

function show(content: string, type: ToastRecord['type'] = 'text', duration?: number) {
  ensureHost()
  clearTimeout(timer)
  const record: ToastRecord = {
    id: nextToastId(),
    content,
    type,
    duration: resolveDuration(type, duration)
  }
  currentToast.value = record
  // loading 型不自动消失，必须由调用方 hide()，否则会永远盖住界面
  if (record.duration > 0) timer = setTimeout(() => (currentToast.value = null), record.duration)
  return record.id
}

export const toast = {
  show,
  success: (content: string, duration?: number) => show(content, 'success', duration),
  error: (content: string, duration?: number) => show(content, 'error', duration),
  loading: (content: string) => show(content, 'loading'),
  hide: () => {
    clearTimeout(timer)
    currentToast.value = null
  }
}
