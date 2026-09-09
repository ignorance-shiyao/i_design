import { ref, watch } from 'vue'
import type { FrameworkId } from '@/data/frameworks'

const STORAGE_KEY = 'i-design:framework'

/**
 * 当前正在看的技术栈。
 *
 * 做成全局单例而非每个标签页各存一份：读文档的人通常只用其中一端，
 * 每翻一页都要重新点一次「React」是纯粹的损耗。
 */
const stored = (() => {
  try {
    return localStorage.getItem(STORAGE_KEY) as FrameworkId | null
  } catch {
    // 隐私模式下 localStorage 会直接抛错，不能让它拖垮整页
    return null
  }
})()

export const currentFramework = ref<FrameworkId>(stored ?? 'vue-next')

watch(currentFramework, (id) => {
  try {
    localStorage.setItem(STORAGE_KEY, id)
  } catch {
    // 存不下就算了，本次会话内仍然有效
  }
})

export function useFramework() {
  return { currentFramework }
}
