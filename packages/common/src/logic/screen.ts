/**
 * 智能体屏幕的纯逻辑。
 *
 * 「看着智能体操作一块屏幕」这件事有一个不明显的难点：
 * **一张静止的画面，看起来和一张卡住的画面一模一样。** 智能体在想事情、
 * 网络断了、进程挂了——三种情况下画面都不动，而用户只能干等。
 * 所以这里的重点不是画面本身，是围着画面的那几行字：现在在做什么、
 * 画面是什么时候的、还能不能插手。
 */
import type { IconName } from '../icons'

export type AgentScreenState = 'connecting' | 'working' | 'paused' | 'done' | 'error'

/**
 * 状态行的文字。
 *
 * 「工作中」三个字没有信息量——用户想知道的是「在做什么」。所以有当前动作时
 * 就显示动作本身，没有时才退回到笼统的说法。
 */
export function screenStatusText(state: AgentScreenState, action = ''): string {
  const trimmed = action.trim()
  switch (state) {
    case 'connecting':
      return '正在连接屏幕'
    case 'working':
      return trimmed || '正在操作'
    case 'paused':
      return trimmed ? `已暂停：${trimmed}` : '已暂停'
    case 'done':
      return '已完成'
    case 'error':
      return trimmed || '出错了'
  }
}

/** 状态对应的图标。与文字成对使用——图标是补充，不是唯一线索 */
export function screenStatusIcon(state: AgentScreenState): IconName {
  switch (state) {
    case 'connecting':
      return 'refresh'
    case 'working':
      return 'sparkle'
    case 'paused':
      return 'minus'
    case 'done':
      return 'check-circle'
    case 'error':
      return 'error-circle'
  }
}

/**
 * 现在能不能接管。
 *
 * 只有正在做事或已暂停时接管才有意义：还没连上时没东西可管，
 * 做完或出错之后接管等于重新开一局，那是另一个按钮的事。
 */
export function canTakeOver(state: AgentScreenState): boolean {
  return state === 'working' || state === 'paused'
}

/**
 * 画面的新鲜度说明。
 *
 * 这是整个组件里最要紧的一行字：静止的画面与卡住的画面长得一样，
 * 不写出「这张画面是什么时候的」，用户会把一次卡死当成智能体在思考，
 * 白等好几分钟。
 *
 * 两秒内不说「刚刚」而是不说话（返回空串）：正常刷新时每一帧都挂一句
 * 「刚刚更新」，那行字就成了噪声，真卡住时反而没人注意到它变了。
 */
export function frameAge(now: number, updatedAt: number): string {
  const seconds = Math.floor((now - updatedAt) / 1000)
  if (seconds < 2) return ''
  if (seconds < 60) return `画面 ${seconds} 秒前`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `画面 ${minutes} 分钟前`
  return `画面 ${Math.floor(minutes / 60)} 小时前`
}

/**
 * 画面已经多久没动了，写成一段时长。
 *
 * 与 `frameAge` 分开：那一个说的是「什么时候的」（画面 44 秒前），
 * 这一个说的是「多久没动」（已经 44 秒）。两者混用会写出
 * 「画面已经 44 秒前没动了」这种句子——「44 秒前」是一个时刻，不是一段时长。
 */
export function frameStaleText(now: number, updatedAt: number): string {
  const seconds = Math.floor((now - updatedAt) / 1000)
  if (seconds < 60) return `画面已经 ${seconds} 秒没动了，可能卡住了`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `画面已经 ${minutes} 分钟没动了，可能卡住了`
  return `画面已经 ${Math.floor(minutes / 60)} 小时没动了，可能卡住了`
}

/** 画面停太久就该提醒：超过这个秒数，「在思考」与「卡住了」得由用户来判断 */
export const FRAME_STALE_SECONDS = 15

/** 画面是不是已经旧到该提醒了。做完之后不提醒——那张画面本来就不会再变 */
export function frameStale(now: number, updatedAt: number, state: AgentScreenState): boolean {
  if (state === 'done' || state === 'error') return false
  return (now - updatedAt) / 1000 >= FRAME_STALE_SECONDS
}

/**
 * 画面框的高宽比，写成 CSS 的 `aspect-ratio` 值。
 *
 * 必须在第一帧到达之前就定下来：不定的话，占位框是一个高度，画面来了是另一个，
 * 整页会在连上的那一刻跳一下——而那一刻用户正盯着这里看。
 */
export function screenAspect(width?: number, height?: number): string {
  if (!width || !height || width <= 0 || height <= 0) return '16 / 10'
  return `${width} / ${height}`
}
