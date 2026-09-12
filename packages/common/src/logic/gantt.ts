/**
 * 甘特图的时间轴与条形布局。
 *
 * 排期图看着只是「一排横条」，但有三件事一旦让每端自己算就会各写各的：
 * 时间域怎么定（照数据的最早/最晚裁，还是补到整周）、
 * 一天该占多宽、以及依赖箭头从哪儿拐弯。
 * 这里只做纯计算：进去是日期与工期，出来是像素坐标，不碰 DOM。
 */

import { addDays, parseISO, toISO } from './date'

export interface GanttTask {
  id: string
  name: string
  /** YYYY-MM-DD，含当天 */
  start: string
  /** YYYY-MM-DD，含当天。与 start 相同表示只占一天 */
  end: string
  /** 完成度 0–1；不传则不画进度层 */
  progress?: number
  /** 依赖的任务 id：本任务要等它们完成 */
  deps?: string[]
  /** 里程碑：零工期的时点，画成菱形而不是横条 */
  milestone?: boolean
}

export interface GanttBar extends GanttTask {
  x: number
  width: number
  y: number
  height: number
  /** 进度层的宽度，已按 progress 截断 */
  progressWidth: number
  /** 结束日已过、但进度不足 1 —— 逾期 */
  overdue: boolean
}

/** 一天最少要占这么宽，否则条与条之间的间隙比条本身还显眼 */
export const GANTT_MIN_DAY_WIDTH = 6

/** 相差多少天（含首尾各算一天时需自行 +1） */
export function daysBetween(from: string, to: string): number {
  const a = parseISO(from)
  const b = parseISO(to)
  if (!a || !b) return 0
  // 按本地零点相减；不用 UTC 时间戳，跨夏令时的那一天会差出 23/25 小时
  return Math.round((b.getTime() - a.getTime()) / 86400000)
}

/**
 * 时间域：把数据的最早/最晚各向外扩到整周。
 *
 * 不贴着数据裁：贴边裁出来的图，第一根条紧贴左边框、最后一根紧贴右边框，
 * 看起来像被截断了；而且「这个项目从周几开始」这类问题在图上根本读不出来。
 * 扩到整周还让上方的周分隔线落在固定位置，横向滚动时不会跳。
 */
export function ganttDomain(
  tasks: GanttTask[],
  weekStart: 0 | 1 = 1
): { from: string; to: string; days: number } {
  const dates = tasks.flatMap((t) => [t.start, t.end]).filter(Boolean).sort()
  if (!dates.length) {
    const today = toISO(new Date())
    return { from: today, to: today, days: 1 }
  }
  const first = parseISO(dates[0])
  const last = parseISO(dates[dates.length - 1])
  if (!first || !last) return { from: dates[0], to: dates[dates.length - 1], days: 1 }

  const back = (first.getDay() - weekStart + 7) % 7
  const forward = 6 - ((last.getDay() - weekStart + 7) % 7)
  const from = addDays(first, -back)
  const to = addDays(last, forward)
  return { from: toISO(from), to: toISO(to), days: daysBetween(toISO(from), toISO(to)) + 1 }
}

/**
 * 排成横条。
 *
 * 一行一个任务，不做自动压行：甘特图的行是有名字的（左侧任务名一一对应），
 * 把两个任务挤进同一行会让左右对不上号。
 */
export function ganttBars(
  tasks: GanttTask[],
  domain: { from: string; days: number },
  { dayWidth = 24, rowHeight = 32, barHeight = 18, today = toISO(new Date()) } = {}
): GanttBar[] {
  const width = Math.max(dayWidth, GANTT_MIN_DAY_WIDTH)
  return tasks.map((task, row) => {
    const offset = daysBetween(domain.from, task.start)
    // 含首尾：3 号到 5 号是三天，不是两天
    const span = task.milestone ? 0 : Math.max(1, daysBetween(task.start, task.end) + 1)
    const progress = Math.min(1, Math.max(0, task.progress ?? 0))
    const barWidth = span * width
    return {
      ...task,
      x: offset * width,
      width: barWidth,
      y: row * rowHeight + (rowHeight - barHeight) / 2,
      height: barHeight,
      progressWidth: barWidth * progress,
      // 只看「结束日已过且没做完」。用开始日判定会把还没开工的未来任务也标成逾期
      overdue: !task.milestone && task.end < today && progress < 1
    }
  })
}

/** 时间轴刻度：一周一格，标注该周的第一天 */
export interface GanttTick {
  iso: string
  x: number
  label: string
  /** 该周是否包含今天 */
  current: boolean
}

export function ganttTicks(
  domain: { from: string; days: number },
  dayWidth = 24,
  today = toISO(new Date())
): GanttTick[] {
  const width = Math.max(dayWidth, GANTT_MIN_DAY_WIDTH)
  const start = parseISO(domain.from)
  if (!start) return []
  const ticks: GanttTick[] = []
  for (let day = 0; day < domain.days; day += 7) {
    const date = addDays(start, day)
    const iso = toISO(date)
    const endOfWeek = toISO(addDays(date, 6))
    ticks.push({
      iso,
      x: day * width,
      label: `${date.getMonth() + 1}/${date.getDate()}`,
      current: iso <= today && today <= endOfWeek
    })
  }
  return ticks
}

/** 今天在图上的横坐标；不在时间域内返回 -1，调用方据此不画这条线 */
export function ganttTodayX(
  domain: { from: string; days: number },
  dayWidth = 24,
  today = toISO(new Date())
): number {
  const offset = daysBetween(domain.from, today)
  if (offset < 0 || offset >= domain.days) return -1
  return offset * Math.max(dayWidth, GANTT_MIN_DAY_WIDTH)
}

/**
 * 依赖箭头的折线点。
 *
 * 从前置任务的右端出发，绕到后继任务的左端。走折线而不是直线：
 * 直线会斜穿过中间几行的横条，读者分不清它连的是哪两根。
 */
export function ganttLinks(bars: GanttBar[], gap = 8): { id: string; points: number[] }[] {
  const byId = new Map(bars.map((b) => [b.id, b]))
  const links: { id: string; points: number[] }[] = []
  for (const bar of bars) {
    for (const dep of bar.deps ?? []) {
      const from = byId.get(dep)
      if (!from) continue
      const x1 = from.x + from.width
      const y1 = from.y + from.height / 2
      const x2 = bar.x
      const y2 = bar.y + bar.height / 2
      // 后继若排在前置左边（排期本身有问题），从前置右侧绕出去再折回来，
      // 而不是画一条穿回头的直线——那条线会盖住中间所有行
      const mid = x2 > x1 + gap * 2 ? x2 - gap : x1 + gap
      links.push({ id: `${dep}->${bar.id}`, points: [x1, y1, mid, y1, mid, y2, x2, y2] })
    }
  }
  return links
}

/**
 * 拓扑校验：依赖是否成环。
 *
 * 成环的排期画出来是一团互相指的箭头，看图的人只会以为是渲染坏了。
 * 返回环上的任务 id，让调用方能直接指出是哪几个。
 */
export function ganttCycle(tasks: GanttTask[]): string[] {
  const byId = new Map(tasks.map((t) => [t.id, t]))
  const state = new Map<string, 0 | 1 | 2>()
  const stack: string[] = []

  function visit(id: string): string[] | null {
    if (state.get(id) === 2) return null
    if (state.get(id) === 1) return stack.slice(stack.indexOf(id))
    state.set(id, 1)
    stack.push(id)
    for (const dep of byId.get(id)?.deps ?? []) {
      if (!byId.has(dep)) continue
      const cycle = visit(dep)
      if (cycle) return cycle
    }
    stack.pop()
    state.set(id, 2)
    return null
  }

  for (const task of tasks) {
    const cycle = visit(task.id)
    if (cycle) return cycle
  }
  return []
}
