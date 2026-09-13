import { useLayoutEffect, useRef, type RefObject } from 'react'

/**
 * 列表增删时让其余项滑过去，而不是跳过去。
 *
 * Vue 有 `<TransitionGroup>` 顺手给了这件事，React 没有等价物，只能自己做一次
 * FLIP：渲染前记下每一项的位置，渲染后量新位置，先用反向位移把它们摆回原处，
 * 下一帧再放开——视觉上就成了从旧位置滑到新位置。
 *
 * 为什么值得做：删掉中间一项时，其余项若瞬间跳到新位置，读者会以为「又刷新了一次」，
 * 也看不出到底哪一项没了。补位过渡让删除的位置一目了然。
 *
 * 类名与时长都用公共层已有的 `${name}-move`，不另起一套——
 * 另起一套的结果是主题面板调慢动效时，Vue 端跟着变、React 端没变。
 *
 * @param container 列表容器
 * @param name 过渡名前缀，如 `i-list`；对应样式里的 `.i-list-move`
 * @param deps 列表内容的依赖，通常是 key 拼成的字符串
 */
export function useFlipMove(
  container: RefObject<HTMLElement | null>,
  name: string,
  deps: unknown
) {
  const previous = useRef(new Map<string, { x: number; y: number }>())

  useLayoutEffect(() => {
    const root = container.current
    if (!root) return

    /*
     * 跟随系统的「减少动态效果」。
     * 这一条不能只写在 CSS 里：反向位移是 JS 设的，CSS 把过渡关掉之后，
     * 元素会一直停在被推回去的旧位置上——比不做动画更糟。
     */
    const reduced =
      typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

    /*
     * 位置按「相对容器」记，不用视口坐标。
     *
     * 删掉一项会让页面变矮，浏览器跟着调整滚动位置——视口坐标于是包含了这段滚动，
     * 算出来的位移会离谱到上千像素（实测过：一次删除算出 1275px）。
     */
    const origin = root.getBoundingClientRect()
    const items = [...root.querySelectorAll<HTMLElement>('[data-flip-key]')]
    const next = new Map<string, { x: number; y: number }>()

    for (const el of items) {
      const key = el.dataset.flipKey!
      const rect = el.getBoundingClientRect()
      const point = { x: rect.left - origin.left, y: rect.top - origin.top }
      next.set(key, point)

      const old = previous.current.get(key)
      if (!old || reduced) continue
      const dx = old.x - point.x
      const dy = old.y - point.y
      // 半个像素的差是布局抖动，不是移动；为它跑一次动画只会让列表发抖
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue

      el.classList.remove(`${name}-move`)
      el.style.transition = 'none'
      el.style.transform = `translate(${dx}px, ${dy}px)`
      // 读一次布局，让上面这两行真的生效；不读的话浏览器会把它和下面的修改合并掉
      void el.offsetWidth
      el.classList.add(`${name}-move`)
      el.style.transition = ''
      el.style.transform = ''

      const done = () => {
        el.classList.remove(`${name}-move`)
        el.removeEventListener('transitionend', done)
      }
      el.addEventListener('transitionend', done)
    }

    previous.current = next
  }, [container, name, deps])
}
