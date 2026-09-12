/**
 * 推理轨迹：把一段「思考过程」拆成看得见的几步。
 *
 * 一整块流水账式的推理文字，读者只会整段跳过——它太长、没有结构，而且大多数时候
 * 用户只想知道两件事：**现在走到哪一步了**，以及**哪一步出了问题**。
 * 拆成步之后这两件事都摆在面上，要细节再展开那一步。
 *
 * 这一层管的是「哪几步默认展开」与「整条轨迹怎么概括」。各端各写一遍的话，
 * 同一条轨迹在 Web 上默认展开出错那步、在别处全折叠，用户得学两遍。
 */

import type { IconName } from '../icons'

/** 这一步在做什么。决定图标的形状——形状是主要线索，颜色只是附带的 */
export type ThinkingStepKind = 'reason' | 'search' | 'code' | 'tool'

export type ThinkingStepStatus = 'done' | 'running' | 'error'

export interface ThinkingStep {
  key: string
  title: string
  /** 展开后看到的内容 */
  detail?: string
  kind?: ThinkingStepKind
  status?: ThinkingStepStatus
}

/**
 * 每种步骤用一个形状不同的图标。
 *
 * 不用颜色区分种类：四种颜色的圆点在灰度打印下是同一个圆点，
 * 而且颜色在这套体系里已经被状态占了——再用一次，两种含义会打架。
 */
export function thinkingStepIcon(kind: ThinkingStepKind = 'reason'): IconName {
  if (kind === 'search') return 'search'
  if (kind === 'code') return 'code'
  if (kind === 'tool') return 'layers'
  return 'sparkle'
}

/**
 * 整条轨迹的概括，折叠时顶在标题上。
 *
 * `activeIndex` 是「现在走到哪一步」：进行中的那一步，没有进行中的就是最后一步。
 * 折叠时不给这个数字，折叠就等于把进度也藏了——而进度恰恰是折叠时最该留下的信息。
 */
export function summarizeThinking(steps: ThinkingStep[]): {
  total: number
  done: number
  running: number
  failed: number
  activeIndex: number
} {
  let done = 0
  let running = 0
  let failed = 0
  let activeIndex = steps.length - 1
  steps.forEach((step, index) => {
    const status = step.status ?? 'done'
    if (status === 'done') done++
    if (status === 'error') failed++
    if (status === 'running') {
      running++
      // 多步同时进行时以第一步为准：读者读的是从上往下的顺序
      if (running === 1) activeIndex = index
    }
  })
  return { total: steps.length, done, running, failed, activeIndex: steps.length ? activeIndex : -1 }
}

/**
 * 默认展开哪几步。
 *
 * 出错的那步一定展开——用户此刻要看的正是错在哪，让他再点一下才看得到是白费一次操作。
 * 进行中的那步也展开：它的内容正在长出来，折着看不到它在动，界面就像卡住了。
 * 其余一律折叠：已经做完且做对的步骤，标题那一行就够了。
 */
export function defaultOpenSteps(steps: ThinkingStep[]): string[] {
  return steps.filter((s) => s.status === 'error' || s.status === 'running').map((s) => s.key)
}

/** 展开 / 收起一步。返回新数组而不是就地改，各端的响应式才认得出变化 */
export function toggleThinkingStep(open: string[], key: string): string[] {
  return open.includes(key) ? open.filter((k) => k !== key) : [...open, key]
}
