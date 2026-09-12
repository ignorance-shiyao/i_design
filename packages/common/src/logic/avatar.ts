/** 头像的取字与配色规则：同一个人在任何端、任何列表里都得到相同结果 */
export const avatarPalette = ['#5e7ce0', '#3ac295', '#fa9841', '#f66f6a', '#7048e8', '#0f766e']

/** 中文取末两字（更能区分同姓），西文取首字母缩写 */
export function initialsOf(name: string) {
  const trimmed = name.trim()
  if (!trimmed) return ''
  if (/[一-龥]/.test(trimmed)) return trimmed.slice(-2)
  return trimmed
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

/**
 * 尺寸档位对应的像素值。
 *
 * 此前 Vue、React、小程序各抄了一份 `{ sm: 24, md: 32, lg: 44 }`，
 * 改一处不会有任何报错，另外两端就此偏离。
 *
 * 头像组里「+N」那个圆点也要用它：它原先在样式里写死 32px，
 * 也就是只有 md 一档对得上，sm 与 lg 都会比旁边的头像大一圈或小一圈。
 */
export function avatarSizePx(size: 'sm' | 'md' | 'lg' | number): number {
  if (typeof size === 'number') return size
  return { sm: 24, md: 32, lg: 44 }[size] ?? 32
}

/** 字符码求和取模：稳定、无需存储、跨端一致 */
export function tintOf(name: string) {
  if (!name) return avatarPalette[0]
  const sum = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return avatarPalette[sum % avatarPalette.length]
}
