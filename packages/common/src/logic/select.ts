/**
 * Select 的选择逻辑：与框架无关的纯函数。
 * Vue 用 ref 包一层、React 用 useState 包一层、小程序用 setData —— 规则本身只写一次。
 */
export interface OptionLike {
  value: string | number
  disabled?: boolean
}

/** 在选项间移动高亮，跳过禁用项；到边界即停（不循环，避免误选） */
export function moveActive<T extends OptionLike>(
  options: T[],
  current: number,
  step: 1 | -1
): number {
  const count = options.length
  if (!count) return -1
  let next = current
  for (let i = 0; i < count; i++) {
    next += step
    if (next < 0 || next >= count) return current
    if (!options[next].disabled) return next
  }
  return current
}

/** 循环移动，用于 Tabs 这类首尾相接的场景 */
export function moveActiveLoop<T extends OptionLike>(
  options: T[],
  current: number,
  step: 1 | -1
): number {
  const count = options.length
  if (!count) return -1
  let next = current
  for (let i = 0; i < count; i++) {
    next = (next + step + count) % count
    if (!options[next].disabled) return next
  }
  return current
}

export function indexOfValue<T extends OptionLike>(options: T[], value: unknown) {
  return options.findIndex((o) => o.value === value)
}

/* ---------- 自动完成 ---------- */

export interface Suggestion {
  value: string
  label?: string
  disabled?: boolean
}

export interface MatchPart {
  text: string
  hit: boolean
}

/**
 * 把候选项按命中位置切成若干段，用来给命中的部分加粗。
 *
 * 各端各自用 indexOf 拼一遍 HTML 是常见做法，问题有两个：
 * 一是大小写不一致时高亮会错位（用小写串找位置、用原串截取），
 * 二是拼 HTML 就得处理转义，漏一处就是注入。返回结构化的段落，
 * 渲染层只管画，两个问题都不存在。
 */
export function matchParts(label: string, keyword: string): MatchPart[] {
  if (!keyword) return [{ text: label, hit: false }]
  const haystack = label.toLowerCase()
  const needle = keyword.toLowerCase()
  const parts: MatchPart[] = []
  let from = 0

  for (;;) {
    const at = haystack.indexOf(needle, from)
    if (at < 0) break
    if (at > from) parts.push({ text: label.slice(from, at), hit: false })
    // 用原串截取而不是小写串：小写串在某些语言里长度会变，截出来就是错位的
    parts.push({ text: label.slice(at, at + needle.length), hit: true })
    from = at + needle.length
  }

  if (from < label.length) parts.push({ text: label.slice(from), hit: false })
  return parts.length ? parts : [{ text: label, hit: false }]
}

/**
 * 过滤候选。
 *
 * 命中前缀的排在命中中段的前面：用户敲「北」，「北京」应当在「湖北」之上。
 * 不排序的话，候选顺序取决于数据源的顺序，看起来像随机的。
 */
export function filterSuggestions<T extends Suggestion>(
  options: T[],
  keyword: string,
  limit = 20
): T[] {
  if (!keyword) return options.slice(0, limit)
  const needle = keyword.toLowerCase()
  const scored: { option: T; rank: number }[] = []

  for (const option of options) {
    const text = (option.label ?? option.value).toLowerCase()
    const at = text.indexOf(needle)
    if (at < 0) continue
    scored.push({ option, rank: at === 0 ? 0 : 1 })
  }

  // 同档内保持数据源原顺序：稳定排序，用户两次输入看到的顺序才一致
  scored.sort((a, b) => a.rank - b.rank)
  return scored.slice(0, limit).map((s) => s.option)
}
