/**
 * 取色器的色彩换算。
 *
 * 明度、色相与对比度的推导直接用 logic/palette 里已有的 OKLCH 实现，
 * 不再引第二套色彩换算——同一个仓库里出现两份「什么叫更亮一点」，
 * 迟早会在某个组件上对不上。
 *
 * 这里只补取色器界面本身需要的 HSV：饱和度-明度方块加色相条这套交互，
 * 用 HSV 是因为它的两个轴正好对应方块的两条边；OKLCH 在感知上更准，
 * 但它的轴不是矩形的，拿来画方块会有一大片取不到的颜色。
 */

import { contrastRatio, hexToRgb, rgbToHex, type Rgb } from './palette'

export interface Hsv {
  /** 色相，0-360 */
  h: number
  /** 饱和度，0-1 */
  s: number
  /** 明度，0-1 */
  v: number
}

/*
 * 通道一律用 palette.ts 的 Rgb 约定：0–1 归一化，不是 0–255。
 *
 * 第一版这里按 0–255 写，而 rgbToHex 会把大于 1 的值夹成 1——
 * 于是 rgb(30, 60, 90) 解析出来是纯白，而整条 HSV 通路（方块位置、
 * 拖动取色）全都在极暗的一角打转。两处都不报错，只是颜色不对。
 */
export function rgbToHsv({ r, g, b }: Rgb): Hsv {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min

  let h = 0
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return { h, s: max === 0 ? 0 : d / max, v: max }
}

export function hsvToRgb({ h, s, v }: Hsv): Rgb {
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c
  const [r, g, b] =
    h < 60 ? [c, x, 0]
    : h < 120 ? [x, c, 0]
    : h < 180 ? [0, c, x]
    : h < 240 ? [0, x, c]
    : h < 300 ? [x, 0, c]
    : [c, 0, x]
  return { r: r + m, g: g + m, b: b + m }
}

export const hexToHsv = (hex: string): Hsv => rgbToHsv(hexToRgb(hex))
export const hsvToHex = (hsv: Hsv): string => rgbToHex(hsvToRgb(hsv))

/**
 * 解析用户输入。
 *
 * 接受 #abc、#aabbcc、abc、aabbcc 与 rgb(1,2,3)——
 * 用户会从各种地方复制色值过来，只认一种写法等于把他们赶回去手工改格式。
 * 解析不出来返回 null，由调用方决定是保留原值还是提示。
 */
export function parseColor(input: string): string | null {
  const text = input.trim().toLowerCase()

  const rgb = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(text)
  if (rgb) {
    const [r, g, b] = [rgb[1], rgb[2], rgb[3]].map(Number)
    if (r > 255 || g > 255 || b > 255) return null
    // CSS 里写的是 0–255，而 Rgb 是 0–1 归一化的，必须换算
    return rgbToHex({ r: r / 255, g: g / 255, b: b / 255 })
  }

  const hex = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/.exec(text)
  if (!hex) return null
  const body = hex[1]
  // 三位简写要展开成六位：#abc 与 #aabbcc 是同一个颜色，但只有后者能直接比对
  const full = body.length === 3 ? body.split('').map((ch) => ch + ch).join('') : body
  return `#${full}`
}

/**
 * 这个颜色配白字还是深字，以及对比度够不够。
 *
 * 取色器要当场把这件事说出来。用户挑的是「好看的颜色」，
 * 而好不好看和上面的字能不能读是两件事——不提示的话，
 * 一个明黄的主色会一路走到线上，然后才发现按钮上的白字看不见。
 */
export interface ColorReadout {
  /** 建议的前景色 */
  ink: string
  ratio: number
  /** 是否达到控件文字的 3:1 下限 */
  passesUi: boolean
  /** 是否达到正文的 4.5:1 */
  passesText: boolean
}

export function colorReadout(hex: string): ColorReadout {
  const white = contrastRatio(hex, '#ffffff')
  const dark = contrastRatio(hex, '#1d2129')
  // 与 contrastText 同一条规则：优先白字，白字达不到 3:1 才换深字
  const ink = white >= 3 ? '#ffffff' : '#1d2129'
  const ratio = ink === '#ffffff' ? white : dark
  return {
    ink,
    ratio: Math.round(ratio * 100) / 100,
    passesUi: ratio >= 3,
    passesText: ratio >= 4.5
  }
}
