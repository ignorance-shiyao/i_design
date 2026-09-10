/**
 * 时间选择的取值规则。
 *
 * 「几点算合法」听起来只是三个数字的事，实际有一串边界：步长不为 1 时哪些值可选、
 * 最小 / 最大时间怎么按位判定、跨天的区间算不算合法。
 * 各端各写一遍，同一个表单在两端上能选的时刻会不一样。
 */

export interface TimeValue {
  hour: number
  minute: number
  second: number
}

export interface TimeOptions {
  /** 时 / 分 / 秒各自的步长 */
  step?: Partial<TimeValue>
  /** 可选范围（含端点）。不传即全天 */
  min?: TimeValue
  max?: TimeValue
  /** 是否显示秒。不显示时秒一律归零，避免留下一个用户没见过的值 */
  showSecond?: boolean
}

export const ZERO: TimeValue = { hour: 0, minute: 0, second: 0 }

/** 折算成当天的秒数，用来比较先后 */
export function toSeconds(time: TimeValue): number {
  return time.hour * 3600 + time.minute * 60 + time.second
}

export function fromSeconds(total: number): TimeValue {
  const clamped = Math.max(0, Math.min(86399, Math.round(total)))
  return {
    hour: Math.floor(clamped / 3600),
    minute: Math.floor((clamped % 3600) / 60),
    second: clamped % 60
  }
}

/**
 * 补零成 HH:mm 或 HH:mm:ss。
 *
 * 一律补零而不是让 9:5 这样出现：时间是要被对齐着读的，
 * 列表里一列宽度不一的时间，扫一眼根本比不出先后。
 */
export function formatTime(time: TimeValue, showSecond = true): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const base = `${pad(time.hour)}:${pad(time.minute)}`
  return showSecond ? `${base}:${pad(time.second)}` : base
}

/** 解析 HH:mm[:ss]。解析不出来返回 null，由调用方决定是清空还是保留原值 */
export function parseTime(text: string): TimeValue | null {
  const match = /^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/.exec(text.trim())
  if (!match) return null
  const hour = Number(match[1])
  const minute = Number(match[2])
  const second = match[3] ? Number(match[3]) : 0
  if (hour > 23 || minute > 59 || second > 59) return null
  return { hour, minute, second }
}

/** 某一列可选的数字。步长按 0 起算，因此 step=15 给出 0/15/30/45 */
export function timeColumn(unit: 'hour' | 'minute' | 'second', step = 1): number[] {
  const size = unit === 'hour' ? 24 : 60
  const safe = Math.max(1, Math.floor(step))
  const out: number[] = []
  for (let i = 0; i < size; i += safe) out.push(i)
  return out
}

/**
 * 这个值在范围内是否可选。
 *
 * 按位判定而不是先拼成完整时间再比大小：选择器是一列一列点的，
 * 用户点「小时」那一刻，分和秒还是上一次的值。拼起来比较的话，
 * 一个本来合法的小时会因为分秒不合法而被禁掉——用户看到的是「这个点点不动」，
 * 而他根本没打算保留那个分秒。
 */
export function isUnitEnabled(
  unit: 'hour' | 'minute' | 'second',
  value: number,
  current: TimeValue,
  { min, max }: { min?: TimeValue; max?: TimeValue } = {}
): boolean {
  if (unit === 'hour') {
    if (min && value < min.hour) return false
    if (max && value > max.hour) return false
    return true
  }

  if (unit === 'minute') {
    if (min && current.hour === min.hour && value < min.minute) return false
    if (max && current.hour === max.hour && value > max.minute) return false
    return true
  }

  if (min && current.hour === min.hour && current.minute === min.minute && value < min.second) return false
  if (max && current.hour === max.hour && current.minute === max.minute && value > max.second) return false
  return true
}

/**
 * 把一个时间夹进范围并对齐到步长。
 *
 * 顺序是先夹范围再对齐步长，不能反过来：先对齐可能把值推出范围外，
 * 再夹回来又不在步长上，于是列表里高亮的那一项和实际值对不上。
 */
export function clampTime(time: TimeValue, options: TimeOptions = {}): TimeValue {
  const { min, max, step = {}, showSecond = true } = options
  let seconds = toSeconds(time)
  if (min) seconds = Math.max(seconds, toSeconds(min))
  if (max) seconds = Math.min(seconds, toSeconds(max))
  const clamped = fromSeconds(seconds)

  const align = (value: number, unitStep?: number) => {
    if (!unitStep || unitStep <= 1) return value
    return Math.floor(value / unitStep) * unitStep
  }

  return {
    hour: align(clamped.hour, step.hour),
    minute: align(clamped.minute, step.minute),
    // 不显示秒时一律归零：留一个用户从没见过的秒数，提交后对不上账
    second: showSecond ? align(clamped.second, step.second) : 0
  }
}

/**
 * 区间是否合法。
 *
 * 允许起止相等（表示一个瞬间），不允许结束早于开始——
 * 跨天的区间要用日期来表达，在只有时分秒的控件里表达跨天，
 * 读者没有任何线索能看出这是「到第二天」。
 */
export function isValidRange(start: TimeValue, end: TimeValue): boolean {
  return toSeconds(end) >= toSeconds(start)
}
