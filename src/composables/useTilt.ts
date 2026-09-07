import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

export interface TiltOptions {
  /** 最大倾斜角度；超过 10 度就会显得廉价 */
  max?: number
  /** 子层浮起的纵深系数 */
  layerScale?: number
}

/**
 * 指针驱动的 3D 倾斜。
 *
 * 只写 CSS 自定义属性、由合成器完成变换，避免每帧触发样式重算；
 * 指针位置在 rAF 里读取，防止 mousemove 频率高于刷新率时做无用功。
 */
export function useTilt(target: Ref<HTMLElement | null>, options: TiltOptions = {}) {
  const { max = 7 } = options
  const active = ref(false)
  let frame = 0
  let pending: { x: number; y: number } | null = null

  const reduced = () =>
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  function apply() {
    frame = 0
    const el = target.value
    if (!el || !pending) return
    const rect = el.getBoundingClientRect()
    // 归一化到 [-1, 1]，中心为 0
    const px = (pending.x - rect.left) / rect.width - 0.5
    const py = (pending.y - rect.top) / rect.height - 0.5
    // Y 轴跟随水平位移，X 轴取反：指针在下方时卡片上沿后仰，符合直觉
    el.style.setProperty('--i-tilt-y', `${px * max * 2}deg`)
    el.style.setProperty('--i-tilt-x', `${-py * max * 2}deg`)
  }

  function onMove(event: PointerEvent) {
    if (reduced()) return
    pending = { x: event.clientX, y: event.clientY }
    if (!frame) frame = requestAnimationFrame(apply)
  }

  function onEnter() {
    if (reduced()) return
    active.value = true
    target.value?.classList.add('is-active')
  }

  function onLeave() {
    active.value = false
    const el = target.value
    if (!el) return
    el.classList.remove('is-active')
    el.style.removeProperty('--i-tilt-x')
    el.style.removeProperty('--i-tilt-y')
  }

  onMounted(() => {
    const el = target.value
    if (!el) return
    el.classList.add('i-tilt')
    // 只在有精确指针的设备上启用：触屏没有悬停，倾斜会在点击后卡住
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    el.addEventListener('pointerenter', onEnter)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
  })

  onBeforeUnmount(() => {
    const el = target.value
    if (!el) return
    el.removeEventListener('pointerenter', onEnter)
    el.removeEventListener('pointermove', onMove)
    el.removeEventListener('pointerleave', onLeave)
    if (frame) cancelAnimationFrame(frame)
  })

  return { active }
}
