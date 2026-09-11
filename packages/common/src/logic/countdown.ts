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

/** 剩余毫秒数。已经过去就是 0，不给负数——「-3 秒」没有意义，只会漏到界面上 */
export function countdownRemaining(target: number, now: number): number {
  return Math.max(0, target - now)
}

/**
 * 把剩余毫秒拆成各时间单位；负数按 0 处理，倒计时不往回走。
 *
 * 不显示毫秒时按「向上取整到秒」拆：剩 1.4 秒时给出 2 秒而不是 1 秒。
 * 向下取整的话，最后那个 00 会挂满整整一秒才结束，用户看到的是「归零了却还没完」；
 * 向上取整则是 01 走完最后一秒，归零与结束同时发生。
 * 显示毫秒时反过来用向下取整——毫秒本来就在跳，再进一位会直接看到数字倒着走。
 */
export function countdownParts(remaining: number, showMilliseconds = false): CountdownParts {
  const raw = Math.max(0, remaining)
  const ms = showMilliseconds ? raw : Math.ceil(raw / 1000) * 1000
  return {
    days: Math.floor(ms / 86400000),
    hours: Math.floor(ms / 3600000) % 24,
    minutes: Math.floor(ms / 60000) % 60,
    seconds: Math.floor(ms / 1000) % 60,
    milliseconds: raw % 1000
  }
}

const pad = (n: number, len = 2) => String(n).padStart(len, '0')

/**
 * 按模板格式化，如 'HH:mm:ss'、'D 天 HH:mm:ss'、'mm:ss.SSS'。
 *
 * 单字母（D/H/m/s）不补零，双字母补两位——与常见日期库同一套约定，
 * 使用方不用另记一套规则。
 *
 * 模板里没出现的那一位会并进相邻的更小单位，而不是被丢掉：
 * 模板是 `mm:ss` 而剩余超过一小时时，丢掉小时会显示成 `05:30`——
 * 看起来还有五分半，实际还有一小时零五分。并进去则是 `65:30`，不会骗人。
 */
export function formatCountdown(remaining: number, format = 'HH:mm:ss') {
  const p = countdownParts(remaining, /S/.test(format))

  let hours = p.hours
  let minutes = p.minutes
  let seconds = p.seconds
  if (!/D/.test(format)) hours += p.days * 24
  if (!/H/.test(format)) minutes += hours * 60
  if (!/m/.test(format)) seconds += minutes * 60

  /* 先换长记号再换短记号：先换 D 的话，DD 会被拆成两段各自替换 */
  return format
    .replace(/DD/g, pad(p.days))
    .replace(/D/g, String(p.days))
    .replace(/HH/g, pad(hours))
    .replace(/H/g, String(hours))
    .replace(/mm/g, pad(minutes))
    .replace(/m/g, String(minutes))
    .replace(/ss/g, pad(seconds))
    .replace(/s/g, String(seconds))
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
