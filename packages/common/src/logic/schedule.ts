/**
 * 把高频事件合并到每帧一次。
 *
 * 滚动与缩放事件的触发频率远高于屏幕刷新率——在触摸屏上一次滑动能打出上百个
 * scroll 事件。每个事件里都去量一次布局（getBoundingClientRect、offsetTop、
 * scrollHeight 这些都会强制同步布局），主线程就被钉死在测量上，
 * 表现为「手指划得动、页面跟不上」。
 *
 * 合并到 rAF 之后每帧最多量一次，而且量在浏览器准备绘制的时刻，读到的值也最新。
 * 这个仓库里原本有五份各自手写的 `let frame = 0` 版本，行为略有出入；
 * 统一到这里，各端（含 React 与移动端）用同一份。
 */

export interface RafThrottled<A extends unknown[]> {
  (...args: A): void
  /** 取消尚未执行的那一帧。组件卸载时必须调用，否则回调会在已销毁的实例上跑 */
  cancel(): void
}

/**
 * 每帧最多执行一次，参数取这一帧内最后一次调用的。
 *
 * 取最后一次而不是第一次：滚动位置这类值，最后一次才是当前真实状态，
 * 用第一次会让画面固定地慢半帧。
 *
 * 什么时候不该用它：只在「停下来之后」才有意义的动作——滚动结束后吸附到整行、
 * 输入停止后再发请求——那是防抖，各自按场景用 setTimeout 写在组件里更清楚
 * （IPicker 的落定判定就是一例）。两者混用会得到「跟手但迟钝」或「灵敏但抖」的手感。
 */
export function rafThrottle<A extends unknown[]>(fn: (...args: A) => void): RafThrottled<A> {
  let frame = 0
  let lastArgs: A | null = null

  const schedule = ((...args: A) => {
    lastArgs = args
    if (frame) return
    frame = requestAnimationFrame(() => {
      frame = 0
      const current = lastArgs
      lastArgs = null
      if (current) fn(...current)
    })
  }) as RafThrottled<A>

  schedule.cancel = () => {
    if (frame) cancelAnimationFrame(frame)
    frame = 0
    lastArgs = null
  }

  return schedule
}
