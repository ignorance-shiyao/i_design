import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

/**
 * 图表按容器的真实宽度设视图坐标，而不是恒定 640。
 *
 * 为什么必须这样：viewBox 固定 640 时，SVG 在 358px 宽的手机上被整体缩到 0.48，
 * 于是 11px 的刻度字实际只有 6px——量出来的，不是感觉。而且轴标签的抽稀
 * （labelStep）按视图宽度算，恒定 640 意味着手机上与桌面排一样多的标签，
 * 缩完就糊成一条黑边。
 *
 * 把视图宽度对齐容器宽度之后，缩放比回到 1：字还是 11px，标签该抽稀就抽稀。
 *
 * 上限 640 是为了让桌面上的刻度密度与以前一致；下限 320 是为了让极窄的容器里
 * 仍有可画的地方，而不是把图压成一条线。没有 ResizeObserver 时（SSR、老环境）
 * 退回 640，与改动前完全一致。
 */
export function useChartWidth(
  host: Ref<Element | null | undefined>,
  { min = 320, max = 640 }: { min?: number; max?: number } = {}
): Ref<number> {
  const width = ref(max)

  let observer: ResizeObserver | null = null

  const measure = (px: number) => {
    if (!px) return
    width.value = Math.round(Math.min(max, Math.max(min, px)))
  }

  onMounted(() => {
    const el = host.value
    if (!el || typeof ResizeObserver === 'undefined') return
    measure(el.getBoundingClientRect().width)
    observer = new ResizeObserver((entries) => {
      for (const entry of entries) measure(entry.contentRect.width)
    })
    observer.observe(el)
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    observer = null
  })

  return width
}
