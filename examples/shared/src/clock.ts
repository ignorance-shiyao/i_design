/**
 * 可控时钟。
 *
 * 示例里到处是「3 分钟前」「本周」「已超时」，它们都依赖 now()。
 * 直接用 Date.now() 的话，同一个页面今天截图与明天截图不一样，
 * 而「已超时」这种状态更是只在特定时刻才出得来——没法稳定演示。
 *
 * 所以统一从这里取时间：默认停在一个固定时刻，需要演示流逝时显式推进。
 */
export interface Clock {
  now(): number
  /** 推进若干毫秒，返回新的时刻 */
  advance(ms: number): number
  /** 回到基准时刻 */
  reset(): void
  /** 基准时刻，reset 回到这里 */
  readonly base: number
}

/** 演示数据的基准时刻：2026-03-16 09:30 (UTC+8)，周一上午，日历与待办都好看 */
export const DEMO_NOW = Date.UTC(2026, 2, 16, 1, 30, 0)

export function createClock(base = DEMO_NOW): Clock {
  let current = base
  return {
    base,
    now: () => current,
    advance: (ms) => (current += ms),
    reset: () => { current = base }
  }
}

export const MINUTE = 60_000
export const HOUR = 60 * MINUTE
export const DAY = 24 * HOUR
