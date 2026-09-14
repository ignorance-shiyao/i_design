/**
 * 确定性随机。
 *
 * 示例应用里的「随机」必须是可复现的：同一个 seed 生成同一批订单、同一条曲线。
 * 否则视觉回归每跑一次都在漂，而漂的那几像素里没人分得清哪些是真回归。
 *
 * 用 mulberry32：32 位状态、四行实现，跨端（TS / Dart）好移植，
 * 分布足够生成演示数据。不用 Math.random——它连「同一次刷新内两次调用一样」
 * 都做不到，更别说跨机器一致。
 */
export interface Rng {
  /** [0, 1) */
  next(): number
  /** [min, max] 的整数 */
  int(min: number, max: number): number
  /** 从数组里取一个 */
  pick<T>(items: readonly T[]): T
  /** 洗牌，不改原数组 */
  shuffle<T>(items: readonly T[]): T[]
  /** 以给定概率返回 true */
  chance(probability: number): boolean
}

export function createRng(seed: number): Rng {
  let state = seed >>> 0
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1))
  return {
    next,
    int,
    pick: (items) => items[int(0, items.length - 1)],
    shuffle: (items) => {
      const out = [...items]
      for (let i = out.length - 1; i > 0; i -= 1) {
        const j = int(0, i)
        ;[out[i], out[j]] = [out[j], out[i]]
      }
      return out
    },
    chance: (probability) => next() < probability
  }
}

/**
 * 由字符串派生 seed。
 *
 * 这样「订单 SO-2026-0007 的明细」可以由单号自己决定，不必把整棵数据树
 * 一次生成出来存着——要哪一条算哪一条，而且每次算出来都一样。
 */
export function seedFrom(text: string): number {
  let hash = 2166136261
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}
