import { onMounted, ref, type Ref } from 'vue'

/**
 * 数字滚动。用于首页统计——静态数字读者会跳过，滚动一下会被看见。
 * 只在元素进入视口时启动，并遵循减少动效偏好。
 */
export function useCountUp(target: Ref<HTMLElement | null>, value: number, duration = 900) {
  const display = ref(0)

  onMounted(() => {
    const el = target.value
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      display.value = value
      return
    }

    const observer = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return
      observer.disconnect()
      const start = performance.now()
      const step = (now: number) => {
        const progress = Math.min(1, (now - start) / duration)
        // easeOutCubic：起步快、收尾稳，读数不会在末尾突然跳变
        display.value = Math.round(value * (1 - Math.pow(1 - progress, 3)))
        if (progress < 1) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    }, { threshold: 0.4 })

    observer.observe(el)
  })

  return display
}
