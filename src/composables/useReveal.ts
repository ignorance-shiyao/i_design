import type { Directive } from 'vue'

/**
 * 滚动进场指令：v-reveal / v-reveal:left / v-reveal="120"（延迟毫秒）
 *
 * 用 IntersectionObserver 而不是监听 scroll——后者每帧都要读布局，
 * 在长页面上会把主线程压满。进场只做一次，之后立刻停止观察。
 */
const observers = new WeakMap<HTMLElement, IntersectionObserver>()

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
          el.classList.add('is-in')
          observer.unobserve(el)
        }
      },
      // 提前 12% 触发：等元素完全进入视口再动，用户已经看到它「凭空出现」了
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    )
    observer.observe(el)
    observers.set(el, observer)
  },
  unmounted(el) {
    observers.get(el)?.disconnect()
    observers.delete(el)
  }
}
