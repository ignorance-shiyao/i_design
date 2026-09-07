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
