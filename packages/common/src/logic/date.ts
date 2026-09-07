/**
 * 日期工具：只处理「日」精度，一律用本地时区，避免 toISOString 的 UTC 偏移把日期挪走一天。
 * 对外交换格式统一为 YYYY-MM-DD 字符串——它可排序、可直接比较、也不带时区歧义。
 */

export interface DateParts {
  year: number
  month: number // 0-11
  day: number
}

export function toISO(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseISO(value?: string | null): Date | null {
  if (!value) return null
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (!match) return null
  const [, y, m, d] = match
  const date = new Date(Number(y), Number(m) - 1, Number(d))
  // 借助 Date 的溢出行为剔除 2 月 30 日这类不存在的日期
  return date.getMonth() === Number(m) - 1 ? date : null
}

export function isSameDay(a: Date | null, b: Date | null) {
  return !!a && !!b && toISO(a) === toISO(b)
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function addMonths(date: Date, delta: number) {
  // 先归到 1 号再加月，避免 1 月 31 日加一个月落到 3 月
  const first = new Date(date.getFullYear(), date.getMonth() + delta, 1)
  const daysInTarget = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()
  first.setDate(Math.min(date.getDate(), daysInTarget))
  return first
}

export function addDays(date: Date, delta: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + delta)
  return next
}

export interface CalendarCell {
  date: Date
  iso: string
  day: number
  /** 是否属于当前展示的月份；上下月补白用于凑满 6 行 */
  outside: boolean
  today: boolean
}

/**
 * 生成 6×7 的日历格子。固定 6 行是为了切换月份时面板高度不跳动。
 * weekStart：0 表示周日开头，1 表示周一开头。
 */
export function buildCalendar(viewDate: Date, weekStart: 0 | 1 = 1): CalendarCell[] {
  const first = startOfMonth(viewDate)
  const offset = (first.getDay() - weekStart + 7) % 7
  const start = addDays(first, -offset)
  const todayISO = toISO(new Date())

  return Array.from({ length: 42 }, (_, i) => {
    const date = addDays(start, i)
    const iso = toISO(date)
    return {
      date,
      iso,
      day: date.getDate(),
      outside: date.getMonth() !== viewDate.getMonth(),
      today: iso === todayISO
    }
  })
}

export const weekdayLabels = (weekStart: 0 | 1 = 1) => {
  const labels = ['日', '一', '二', '三', '四', '五', '六']
  return weekStart === 1 ? [...labels.slice(1), labels[0]] : labels
}

/** 按 format 模板输出：YYYY / MM / DD，其余字符原样保留 */
export function formatDate(date: Date, format = 'YYYY-MM-DD') {
  return format
    .replace('YYYY', String(date.getFullYear()))
    .replace('MM', String(date.getMonth() + 1).padStart(2, '0'))
    .replace('DD', String(date.getDate()).padStart(2, '0'))
}
