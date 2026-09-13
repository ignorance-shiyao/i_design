/** 头像的取字与配色规则：同一个人在任何端、任何列表里都得到相同结果 */
import { solidPair } from './palette'

/*
 * 六个身份色的原始取值。对外暴露的是经过 `solidPair` 校准的那一份——
 * 底色与字色必须成对，否则会出现「字色按压深后的底算，底却没压」这种错位，
 * 对比度反而更差（实测过：品牌蓝那一档白字仍是 3.86）。
 */
const RAW_AVATAR_PALETTE = ['#5e7ce0', '#3ac295', '#fa9841', '#f66f6a', '#7048e8', '#0f766e']

/** 头像底色。品牌蓝那一档被压深了 ΔL 0.04，以便白字够读；其余几档原样 */
export const avatarPalette = RAW_AVATAR_PALETTE.map((fill) => solidPair(fill).solid)

/** 与 avatarPalette 同下标的字色 */
export const avatarInkPalette = RAW_AVATAR_PALETTE.map((fill) => solidPair(fill).ink)

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

/**
 * 头像底色配的字色。
 *
 * 这六个底色里有一半压不住白字：成功绿 2.25、警告橙 2.18、危险红 2.84——
 * 连图形的 3:1 下限都不到。此前样式里写死 `color: #fff`，于是一半的头像上
 * 那两个字是糊的。改成按底色算：压得深就白字，压不深就用带同一色相的深字。
 */
export function tintInkOf(name: string) {
  if (!name) return avatarInkPalette[0]
  const sum = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return avatarInkPalette[sum % avatarInkPalette.length]
}

/** 字符码求和取模：稳定、无需存储、跨端一致 */
export function tintOf(name: string) {
  if (!name) return avatarPalette[0]
  const sum = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return avatarPalette[sum % avatarPalette.length]
}
