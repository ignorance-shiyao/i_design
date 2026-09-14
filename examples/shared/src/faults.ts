/**
 * 异常控制台的那个「台」：可切换的故障开关，以及一键恢复。
 *
 * 异常分支写完之后没人验过，是因为开发机上它们一次都不会发生。
 * 把每一种异常变成一个可以随手打开的开关，它们才会被真的看见——
 * 包括「打开之后界面变成什么样」这种只能用眼睛判断的事。
 *
 * 这里只有状态与订阅，控制台的界面由示例应用的外壳渲染（G02）。
 * 分开是因为：状态要能在测试里直接驱动，不必先渲染一个界面出来。
 */
import type { Fault } from './api'

/** 故障清单。文案就是控制台上的选项，别处不再抄一份 */
export const FAULTS: readonly { value: Fault | 'out-of-order' | 'reconnect'; label: string; hint: string }[] = [
  { value: 'none', label: '正常', hint: '不注入任何异常' },
  { value: 'forbidden', label: '403 无权限', hint: '当前角色不能做这个操作' },
  { value: 'conflict', label: '409 版本冲突', hint: '详情页停留期间别人改过' },
  { value: 'rate-limit', label: '429 过于频繁', hint: '短时间内重复提交' },
  { value: 'timeout', label: '408 超时', hint: '请求发出去了，但没有回应' },
  { value: 'partial', label: '部分失败', hint: '批量导入里有几行没进去' },
  { value: 'out-of-order', label: '事件乱序', hint: '流式片段不按顺序到达' },
  { value: 'reconnect', label: '断线重连', hint: '流中途断开，带游标恢复' }
]

export type FaultKind = (typeof FAULTS)[number]['value']

export interface FaultConsole {
  readonly current: FaultKind
  set(kind: FaultKind): void
  /** 一键恢复：回到正常，并把订阅者叫醒去重置自己的数据 */
  reset(): void
  subscribe(listener: (kind: FaultKind) => void): () => void
}

export function createFaultConsole(initial: FaultKind = 'none'): FaultConsole {
  let current = initial
  const listeners = new Set<(kind: FaultKind) => void>()
  const emit = () => { for (const listener of [...listeners]) listener(current) }

  return {
    get current() { return current },
    set(kind) {
      if (kind === current) return
      current = kind
      emit()
    },
    reset() {
      current = 'none'
      emit()
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    }
  }
}
