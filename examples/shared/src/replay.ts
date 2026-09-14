/**
 * 确定性事件重放。
 *
 * 「乱序」「重发」「断流」这三种情况，reducer 那边写了处理，但要验证它们
 * 在真实链路上确实被处理了，就得先把它们造出来——而且造出来的必须是
 * **同一种乱法**：随机乱序的话，失败复现不了，视觉快照也每跑一次不一样。
 *
 * 所以乱序由 seed 决定：同一个 seed 得到同一个投递顺序。
 */
import type { RunEvent } from '@i-design/common'
import { createRng } from './rng'

export interface ReplayOptions {
  /** 乱序窗口：在多大的范围内打乱。0 表示不打乱 */
  shuffleWindow?: number
  /** 重复投递的比例，0–1 */
  duplicateRate?: number
  /** 在第几条之后断开（1 基）；断开之后从游标恢复 */
  dropAfter?: number
  seed?: number
}

export interface Delivery {
  event: RunEvent
  /** 这一条是不是重复投递的 */
  duplicate: boolean
  /** 断线恢复之后的那一批 */
  afterReconnect: boolean
}

/**
 * 把一串事件排成「实际投递顺序」。
 *
 * 乱序只在窗口内发生：真实网络不会把第 1 条排到第 90 条之后，
 * 窗口之外的乱序造出来的是一个不会发生的场景，测出来的结论也没用。
 */
export function planDelivery(events: readonly RunEvent[], options: ReplayOptions = {}): Delivery[] {
  const rng = createRng(options.seed ?? 1)
  const window = options.shuffleWindow ?? 0
  const duplicateRate = options.duplicateRate ?? 0
  const dropAfter = options.dropAfter ?? 0

  const ordered: RunEvent[] = []
  const queue = [...events]
  while (queue.length) {
    if (window > 1) {
      const take = rng.int(0, Math.min(window, queue.length) - 1)
      ordered.push(queue.splice(take, 1)[0])
    } else {
      ordered.push(queue.shift()!)
    }
  }

  const out: Delivery[] = []
  let delivered = 0
  let reconnected = false
  for (const event of ordered) {
    delivered += 1
    if (dropAfter && !reconnected && delivered > dropAfter) {
      /*
       * 断线恢复：服务端从游标之后接着发，而游标那一条常常会再发一遍。
       * 这一遍必须是重复而不是新内容，否则「重连之后念了两遍」就测不出来。
       */
      reconnected = true
      const resume = out[out.length - 1]
      if (resume) out.push({ event: resume.event, duplicate: true, afterReconnect: true })
    }
    out.push({ event, duplicate: false, afterReconnect: reconnected })
    if (duplicateRate > 0 && rng.chance(duplicateRate)) {
      out.push({ event, duplicate: true, afterReconnect: reconnected })
    }
  }
  return out
}
