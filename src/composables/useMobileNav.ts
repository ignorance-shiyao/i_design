import { ref, watch } from 'vue'

/**
 * 窄屏导航抽屉的开合状态。
 *
 * 放在组件之外，是因为触发按钮在页头、内容在抽屉里，
 * 两者不在同一棵组件树上；用一个共享的 ref 比层层透传事件简单。
 */
export const mobileNavOpen = ref(false)

// 抽屉打开时锁住页面滚动，否则手指划在抽屉外会滚动背后的正文
watch(mobileNavOpen, (open) => {
  if (typeof document === 'undefined') return
  document.body.style.overflow = open ? 'hidden' : ''
})

export function useMobileNav() {
  return { mobileNavOpen }
}
