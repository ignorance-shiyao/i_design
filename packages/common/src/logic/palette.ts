/**
 * 从一个基色推导出整条品牌色阶。
 *
 * 主题定制如果让用户逐个填 brand / hover / active / subtle 四个值，
 * 得到的多半是四个不成体系的颜色——hover 比正常态还暗、subtle 深到压住文字。
 * 这里只收一个基色，其余按固定的明度关系推导：
 * 关系一旦定死，任何基色推出来的色阶都保持同样的层次感。
 *
 * 计算在 OKLCH 里做而不是 HSL：HSL 的「亮度」不是人眼感知的亮度，
 * 同一个 L 值下黄色远亮于蓝色，按 HSL 均匀取阶得到的色阶在感知上是歪的。
 */

export interface Rgb {
  r: number
  g: number
  b: number
}

export interface Oklch {
  l: number
  c: number
  h: number
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

export function hexToRgb(hex: string): Rgb {
  let value = hex.trim().replace('#', '')
  if (value.length === 3) value = [...value].map((c) => c + c).join('')
  const int = parseInt(value.slice(0, 6), 16)
  return { r: ((int >> 16) & 255) / 255, g: ((int >> 8) & 255) / 255, b: (int & 255) / 255 }
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const to = (v: number) =>
    Math.round(clamp01(v) * 255)
      .toString(16)
      .padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`
}

/* sRGB 传输函数：转换必须先线性化，否则算出来的明度是错的 */
const toLinear = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
const toGamma = (v: number) => (v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055)

export function rgbToOklch({ r, g, b }: Rgb): Oklch {
  const lr = toLinear(r)
  const lg = toLinear(g)
  const lb = toLinear(b)

  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)

  const okL = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const okA = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const okB = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s

  const hue = (Math.atan2(okB, okA) * 180) / Math.PI
  return {
    l: okL,
    c: Math.sqrt(okA * okA + okB * okB),
    h: hue < 0 ? hue + 360 : hue
  }
}

export function oklchToRgb({ l, c, h }: Oklch): Rgb {
  const rad = (h * Math.PI) / 180
  const okA = c * Math.cos(rad)
  const okB = c * Math.sin(rad)

  const l_ = (l + 0.3963377774 * okA + 0.2158037573 * okB) ** 3
  const m_ = (l - 0.1055613458 * okA - 0.0638541728 * okB) ** 3
  const s_ = (l - 0.0894841775 * okA - 1.291485548 * okB) ** 3

  return {
    r: toGamma(4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_),
    g: toGamma(-1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_),
    b: toGamma(-0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_)
  }
}

/** 保持色相与彩度，只把明度移到目标值 */
export function withLightness(hex: string, lightness: number): string {
  const { c, h } = rgbToOklch(hexToRgb(hex))
  return rgbToHex(oklchToRgb({ l: clamp01(lightness), c, h }))
}

export interface BrandRamp {
  brand: string
  hover: string
  active: string
  subtle: string
  /** 品牌色上的文字色：按对比度决定用白还是深色，而不是一律用白 */
  onBrand: string
  /**
   * onBrand 与品牌色的实际对比度。
   *
   * 中等明度的品牌色上，白字与深字都到不了正文要求的 4.5:1
   * （#5e7ce0 最好也只有 4.18）——这是那个颜色的固有限制，不是可以调好的参数。
   * 因此这里把数值一并给出，让配置界面据实告警，而不是悄悄放过：
   * 3:1 是大字与控件的下限，低于它连按钮文字都不该用。
   */
  onBrandContrast: number
  shadow: string
  gradient: string
}

/*
 * 明度关系。亮色模式下 hover 比基色更亮、active 更暗；
 * 暗色模式反过来——在深色背景上「更亮」才读作强调，照搬亮色的关系会让悬停看起来像禁用。
 */
const LIGHT = { hover: 0.12, active: -0.1, subtle: 0.96 }
const DARK = { hover: 0.1, active: -0.12, subtle: 0.3 }

/**
 * 由基色推导一整套品牌色。
 * subtle 在亮色下是一个几乎白的同色相底色；暗色下不能同样处理——
 * 那会得到一块比背景还亮的色块，所以改为压暗并降彩度。
 */
export function brandRamp(base: string, mode: 'light' | 'dark' = 'light'): BrandRamp {
  const { l, c, h } = rgbToOklch(hexToRgb(base))
  const step = mode === 'light' ? LIGHT : DARK

  const brand = rgbToHex(oklchToRgb({ l, c, h }))
  const hover = rgbToHex(oklchToRgb({ l: clamp01(l + step.hover), c, h }))
  const active = rgbToHex(oklchToRgb({ l: clamp01(l + step.active), c, h }))
  const subtle =
    mode === 'light'
      ? rgbToHex(oklchToRgb({ l: step.subtle, c: Math.min(c, 0.05), h }))
      : rgbToHex(oklchToRgb({ l: step.subtle, c: Math.min(c, 0.07), h }))

  const rgb = hexToRgb(brand)
  const shadow = `0 8px 24px -8px rgba(${Math.round(rgb.r * 255)}, ${Math.round(
    rgb.g * 255
  )}, ${Math.round(rgb.b * 255)}, 0.5)`

  return {
    brand,
    hover,
    active,
    subtle,
    onBrand: contrastText(brand),
    onBrandContrast: contrastRatio(brand, contrastText(brand)),
    shadow,
    gradient: `linear-gradient(135deg, ${hover} 0%, ${brand} 50%, ${active} 100%)`
  }
}

/** 相对亮度，用于对比度计算 */
function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex)
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}

/** WCAG 对比度，1–21 */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a)
  const lb = luminance(b)
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

/**
 * 在给定底色上选一个可读的文字色。
 * 一律用白字在浅色主题色（比如明黄）上会低到 1.5:1，几乎看不见。
 */
export function contrastText(background: string): string {
  return contrastRatio(background, '#ffffff') >= contrastRatio(background, '#1d2129')
    ? '#ffffff'
    : '#1d2129'
}
