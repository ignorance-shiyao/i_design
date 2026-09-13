/**
 * 「已等多久」的显示规则。
 *
 * 智能体的一次调用动辄十几秒。只转一个圈而不说等了多久，用户没有参照，
 * 三秒和三十秒看起来一模一样——于是有人开始反复点，或者以为卡死了刷新页面，
 * 前一次请求的结果就此丢掉。
 *
 * 规则本身有两处很容易各端各写一遍：从第几秒开始显示，以及怎么进位。
 */

/**
 * 多久之后才显示计时。
 *
 * 一秒内就返回的请求上挂一个「0 秒」只会让界面更吵。三秒是个折中：
 * 比它快的请求用户根本来不及产生「是不是卡了」的疑问。
 */
export const ELAPSED_THRESHOLD = 3000

/** 到点了吗。没到就只转圈，不给数字 */
export function shouldShowElapsed(ms: number, threshold = ELAPSED_THRESHOLD): boolean {
  return ms >= threshold
}

export interface ElapsedParts {
  minutes: number
  seconds: number
}

/**
 * 拆成分与秒。
 *
 * 向下取整而不是四舍五入：显示「5 秒」时实际至少已经等了 5 秒，
 * 取整到 6 秒会出现「数字比真实时间还大」，在计时这件事上比慢一点更糟。
 *
 * 不显示毫秒：一个每 50ms 跳一次的数字会把注意力从「还在等」拉到数字本身，
 * 而它多出来的那点信息对等待的人没有任何用处。
 */
export function elapsedParts(ms: number): ElapsedParts {
  const total = Math.max(0, Math.floor(ms / 1000))
  return { minutes: Math.floor(total / 60), seconds: total % 60 }
}

/**
 * 下一次刷新该等多久（毫秒）。
 *
 * 对齐到下一个整秒，而不是固定 1000ms：固定间隔会累积漂移，
 * 等上两分钟之后，显示的秒数会明显比真实时间慢。
 */
export function elapsedInterval(ms: number): number {
  const rest = ms % 1000
  return rest === 0 ? 1000 : 1000 - rest
}
