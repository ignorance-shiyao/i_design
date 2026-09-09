/**
 * 倒计时的时间计算与格式化。
 *
 * 放在共享层是因为它有两个容易各写各的坑：一是补零与进位规则，
 * 二是「剩余时间要按目标时刻算，不能靠累加间隔」——后者在页面被切到后台时
 * 会明显走慢，两端各实现一次就会各慢各的。
 */

export interface CountdownParts {
  days: number
  hours: number
  minutes: number
  seconds: number
  milliseconds: number
}

/** 把剩余毫秒拆成各时间单位；负数按 0 处理，倒计时不往回走 */
export function countdownParts(remaining: number): CountdownParts {
  const ms = Math.max(0, remaining)
  return {
    days: Math.floor(ms / 86400000),
    hours: Math.floor(ms / 3600000) % 24,
    minutes: Math.floor(ms / 60000) % 60,
    seconds: Math.floor(ms / 1000) % 60,
    milliseconds: ms % 1000
  }
}

const pad = (n: number, len = 2) => String(n).padStart(len, '0')

/**
 * 按模板格式化，如 'HH:mm:ss'、'D 天 HH:mm:ss'、'mm:ss.SSS'。
 *
 * 单字母（D/H/m/s）不补零，双字母补两位——与常见日期库同一套约定，
 * 使用方不用另记一套规则。
 */
export function formatCountdown(remaining: number, format = 'HH:mm:ss') {
  const p = countdownParts(remaining)
  return format
    .replace(/DD/g, pad(p.days))
    .replace(/D/g, String(p.days))
    .replace(/HH/g, pad(p.hours))
    .replace(/H/g, String(p.hours))
    .replace(/mm/g, pad(p.minutes))
    .replace(/m/g, String(p.minutes))
    .replace(/ss/g, pad(p.seconds))
    .replace(/s/g, String(p.seconds))
    .replace(/SSS/g, pad(p.milliseconds, 3))
    .replace(/SS/g, pad(Math.floor(p.milliseconds / 10)))
    .replace(/S/g, String(Math.floor(p.milliseconds / 100)))
}

/**
 * 下一次刷新该等多久。
 *
 * 固定 1000ms 会累积漂移：一秒刷一次、每次晚几毫秒，几分钟后显示的秒数就跳格了。
 * 这里对齐到下一个整单位边界，让每一跳都落在该跳的时刻上。
 */
export function countdownInterval(remaining: number, millisecond = false) {
  if (millisecond) return 50
  const rest = remaining % 1000
  return rest === 0 ? 1000 : rest
}
