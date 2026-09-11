import type { Directive } from 'vue'
import { rafThrottle } from '@i-design/common'

/**
 * 滚动进场指令：v-reveal / v-reveal:left / v-reveal="120"（延迟毫秒）
 *
 * 用 IntersectionObserver 而不是监听 scroll——后者每帧都要读布局，
 * 在长页面上会把主线程压满。进场只做一次，之后立刻停止观察。
 */
const observers = new WeakMap<HTMLElement, IntersectionObserver>()

/*
 * 还没进场的元素登记在这里。
 *
 * 光靠 IntersectionObserver 会漏一种情况：用户一把拖到页面底部、或者带锚点
 * 直接打开某一节，中间那些元素从「在视口下方」直接变成「在视口上方」，
 * isIntersecting 始终是 false，观察器根本不会再回调一次——
 * 它们就永远停在 opacity: 0，往回滚看到的是一片空白，而且再也不会恢复。
 *
 * 所以补一个扫描：只在还有未进场元素时挂载，扫完就自己摘掉，
 * 并且用 rAF 合并——每帧最多读一次布局，读的还只是这几个待定元素。
 */
const pending = new Set<HTMLElement>()
let sweeping = false

function reveal(el: HTMLElement, instant: boolean) {
  // 已经滚过去的没必要再演一遍进场，直接给最终态
  if (instant) el.style.animationDuration = '0ms'
  el.classList.add('is-in')
  pending.delete(el)
  observers.get(el)?.unobserve(el)
  if (!pending.size) stopSweep()
}

function sweep() {
  for (const el of [...pending]) {
    const rect = el.getBoundingClientRect()
    if (rect.top < window.innerHeight * 0.92) reveal(el, rect.bottom < 0)
  }
}

/* 整页共用一次扫描，且每帧最多一次：扫描要读每个待进场元素的位置 */
const onScroll = rafThrottle(sweep)

function startSweep() {
  if (sweeping) return
  sweeping = true
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
}

function stopSweep() {
  if (!sweeping) return
  sweeping = false
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
  onScroll.cancel()
}

export const vReveal: Directive<HTMLElement, number | undefined> = {
  mounted(el, binding) {
    // 尊重系统偏好：直接呈现最终状态，不做任何动画
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('i-reveal', 'is-in')
      return
    }

    const variant = binding.arg ? `i-reveal--${binding.arg}` : ''
    el.classList.add('i-reveal')
    if (variant) el.classList.add(variant)
    if (binding.value) el.style.setProperty('--i-reveal-delay', `${binding.value}ms`)

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          reveal(el, false)
        }
      },
      // 提前 12% 触发：等元素完全进入视口再动，用户已经看到它「凭空出现」了
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    )
    observer.observe(el)
    observers.set(el, observer)
    pending.add(el)
    startSweep()
  },
  unmounted(el) {
    observers.get(el)?.disconnect()
    observers.delete(el)
    pending.delete(el)
    if (!pending.size) stopSweep()
  }
}
