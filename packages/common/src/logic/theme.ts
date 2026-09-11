/**
 * 主题配置：把「用户在配置面板里的选择」翻译成一张令牌覆盖表。
 *
 * 这里只有纯计算，没有 DOM、没有框架——各端拿到同一张表之后，
 * Web 写成 CSS 变量、小程序写成 WXSS 变量、Flutter 写成 Dart 常量，
 * 三边得到的主题必然一致。把这套算法放在组件里写一遍是这个仓库最容易犯的错：
 * 那样「同一个主题在小程序上偏一点」就只能靠肉眼发现。
 *
 * 覆盖表里的键名不带 `--i-` 前缀，与 tokens 的 flatten() 保持同一套命名。
 */

import {
  controlHeight as controlHeightTokens,
  darkTheme,
  fontSize as fontSizeTokens,
  lightTheme,
  lineHeight as lineHeightTokens,
  motion as motionTokens,
  radius as radiusTokens,
  shadow as shadowTokens,
  shadowDark as shadowDarkTokens,
  spacing as spacingTokens
} from '../tokens'
import { brandRamp, hexToRgb, oklchToRgb, rgbToHex, rgbToOklch } from './palette'

export type ThemeMode = 'light' | 'dark'
/** 三档预设 + 自定义。自定义档下读各自的 *Custom 字段，预设档下按倍率算 */
export type ScaleLevel = 'compact' | 'default' | 'loose' | 'custom'
export type ShadowLevel = 'none' | 'soft' | 'default' | 'strong' | 'custom'
export type LineHeightLevel = 'tight' | 'base' | 'loose'
export type FontFamilyLevel = 'system' | 'serif' | 'mono'
export type MotionSpeed = 'slow' | 'default' | 'fast'
export type ThemeTransition = 'reveal' | 'dim' | 'none'

export type FontSizeKey = keyof typeof fontSizeTokens
/** none 恒为 0、full 恒为圆，两端都不该由用户调 */
export type RadiusKey = Exclude<keyof typeof radiusTokens, 'none' | 'full'>
export type ControlSizeKey = keyof typeof controlHeightTokens
export type ShadowKey = keyof typeof shadowTokens

export const FONT_SIZE_KEYS = Object.keys(fontSizeTokens) as FontSizeKey[]
export const RADIUS_KEYS = (Object.keys(radiusTokens) as (keyof typeof radiusTokens)[]).filter(
  (k): k is RadiusKey => k !== 'none' && k !== 'full'
)
export const CONTROL_SIZE_KEYS = Object.keys(controlHeightTokens) as ControlSizeKey[]

export interface ThemeConfig {
  /** 主题色。其余三档（悬停/按下/衬底）由它推导，不单独配置 */
  brand: string
  success: string
  warning: string
  danger: string
  /** 中性色向主题色偏移的强度，0–100。0 是纯灰 */
  neutralTint: number

  fontFamily: FontFamilyLevel
  fontSize: ScaleLevel
  fontSizeCustom: Record<FontSizeKey, number>
  lineHeight: LineHeightLevel

  radius: ScaleLevel
  radiusCustom: Record<RadiusKey, number>

  shadow: ShadowLevel
  /** 自定义档下的阴影强度，0–200（%） */
  shadowIntensity: number

  /** 间距与控件高度的密度 */
  density: ScaleLevel
  /** 自定义档下的间距倍率，50–200（%） */
  spacingScale: number
  controlHeightCustom: Record<ControlSizeKey, number>

  motion: boolean
  motionSpeed: MotionSpeed
  themeTransition: ThemeTransition
}

const RADIUS_SCALE: Record<Exclude<ScaleLevel, 'custom'>, number> = {
  compact: 0.5,
  default: 1,
  loose: 2
}
const FONT_SCALE: Record<Exclude<ScaleLevel, 'custom'>, number> = {
  compact: 0.92,
  default: 1,
  loose: 1.15
}
const DENSITY_SCALE: Record<Exclude<ScaleLevel, 'custom'>, number> = {
  compact: 0.8,
  default: 1,
  loose: 1.25
}
/** 阴影强度：分「透明度」与「模糊/位移」两个系数，只调透明度会让强档显得脏 */
const SHADOW_PRESET: Record<Exclude<ShadowLevel, 'custom'>, number> = {
  none: 0,
  soft: 0.6,
  default: 1,
  strong: 1.6
}
const MOTION_SPEED: Record<MotionSpeed, number> = { slow: 1.6, default: 1, fast: 0.6 }

const SERIF_STACK =
  "'Songti SC', 'Noto Serif SC', 'Source Han Serif SC', 'Times New Roman', Georgia, serif"

const px = (value: number) => `${Math.round(value)}px`
const clamp = (v: number, min: number, max: number) => (v < min ? min : v > max ? max : v)
const num = (v: unknown, fallback: number, min: number, max: number) =>
  typeof v === 'number' && Number.isFinite(v) ? clamp(v, min, max) : fallback

const numberMap = <K extends string>(
  keys: K[],
  base: Record<string, string>,
  raw: unknown,
  min: number,
  max: number
): Record<K, number> => {
  const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const out = {} as Record<K, number>
  for (const key of keys) out[key] = num(source[key], parseFloat(base[key]), min, max)
  return out
}

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  brand: '#5e7ce0',
  success: '#3ac295',
  warning: '#fa9841',
  danger: '#f66f6a',
  neutralTint: 0,

  fontFamily: 'system',
  fontSize: 'default',
  fontSizeCustom: numberMap(FONT_SIZE_KEYS, fontSizeTokens, null, 10, 96),
  lineHeight: 'base',

  radius: 'default',
  radiusCustom: numberMap(RADIUS_KEYS, radiusTokens, null, 0, 32),

  shadow: 'default',
  shadowIntensity: 100,

  density: 'default',
  spacingScale: 100,
  controlHeightCustom: numberMap(CONTROL_SIZE_KEYS, controlHeightTokens, null, 20, 72),

  motion: true,
  motionSpeed: 'default',
  themeTransition: 'reveal'
}

const isHex = (v: unknown): v is string => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v)

const oneOf = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
  allowed.includes(value as T) ? (value as T) : fallback

/**
 * 持久化数据可能来自旧版本或手工修改，因此逐字段校验：
 * 任何一个读不懂的值都退回默认，而不是让它原样写进 :root——
 * 一个非法的圆角值会让整页的圆角令牌失效，且不会有任何报错。
 */
export function normalizeThemeConfig(value: unknown): ThemeConfig {
  const raw = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
  const level = (v: unknown): ScaleLevel =>
    oneOf(v, ['compact', 'default', 'loose', 'custom'] as const, 'default')
  const color = (v: unknown, fallback: string) => (isHex(v) ? v : fallback)

  return {
    brand: color(raw.brand, DEFAULT_THEME_CONFIG.brand),
    success: color(raw.success, DEFAULT_THEME_CONFIG.success),
    warning: color(raw.warning, DEFAULT_THEME_CONFIG.warning),
    danger: color(raw.danger, DEFAULT_THEME_CONFIG.danger),
    neutralTint: num(raw.neutralTint, 0, 0, 100),

    fontFamily: oneOf(raw.fontFamily, ['system', 'serif', 'mono'] as const, 'system'),
    fontSize: level(raw.fontSize),
    fontSizeCustom: numberMap(FONT_SIZE_KEYS, fontSizeTokens, raw.fontSizeCustom, 10, 96),
    lineHeight: oneOf(raw.lineHeight, ['tight', 'base', 'loose'] as const, 'base'),

    radius: level(raw.radius),
    radiusCustom: numberMap(RADIUS_KEYS, radiusTokens, raw.radiusCustom, 0, 32),

    shadow: oneOf(raw.shadow, ['none', 'soft', 'default', 'strong', 'custom'] as const, 'default'),
    shadowIntensity: num(raw.shadowIntensity, 100, 0, 200),

    density: level(raw.density),
    spacingScale: num(raw.spacingScale, 100, 50, 200),
    controlHeightCustom: numberMap(
      CONTROL_SIZE_KEYS,
      controlHeightTokens,
      raw.controlHeightCustom,
      20,
      72
    ),

    motion: typeof raw.motion === 'boolean' ? raw.motion : true,
    motionSpeed: oneOf(raw.motionSpeed, ['slow', 'default', 'fast'] as const, 'default'),
    themeTransition: oneOf(raw.themeTransition, ['reveal', 'dim', 'none'] as const, 'reveal')
  }
}

/* ------------------------------------------------------------------ 刻度 */

/** 字号：xs 不低于 12px——再小的正文在 1x 屏上会糊成一团 */
export function resolveFontSizes(config: ThemeConfig): Record<FontSizeKey, number> {
  if (config.fontSize === 'custom') return { ...config.fontSizeCustom }
  const scale = FONT_SCALE[config.fontSize]
  const out = {} as Record<FontSizeKey, number>
  for (const key of FONT_SIZE_KEYS) {
    out[key] = Math.max(key === 'xs' ? 12 : 1, Math.round(parseFloat(fontSizeTokens[key]) * scale))
  }
  return out
}

export function resolveRadii(config: ThemeConfig): Record<RadiusKey, number> {
  if (config.radius === 'custom') return { ...config.radiusCustom }
  const scale = RADIUS_SCALE[config.radius]
  const out = {} as Record<RadiusKey, number>
  for (const key of RADIUS_KEYS) out[key] = Math.round(parseFloat(radiusTokens[key]) * scale)
  return out
}

export function resolveSpacingScale(config: ThemeConfig): number {
  return config.density === 'custom' ? config.spacingScale / 100 : DENSITY_SCALE[config.density]
}

export function resolveSpacing(config: ThemeConfig): Record<string, number> {
  const scale = resolveSpacingScale(config)
  const out: Record<string, number> = {}
  for (const [key, value] of Object.entries(spacingTokens)) {
    const base = parseFloat(value)
    // 4px 栅格：缩放后仍要落在偶数像素上，否则发丝线会被渲染成两像素的灰边
    out[key] = base === 0 ? 0 : Math.max(2, Math.round((base * scale) / 2) * 2)
  }
  return out
}

export function resolveControlHeights(config: ThemeConfig): Record<ControlSizeKey, number> {
  if (config.density === 'custom') return { ...config.controlHeightCustom }
  const scale = DENSITY_SCALE[config.density]
  const out = {} as Record<ControlSizeKey, number>
  for (const key of CONTROL_SIZE_KEYS) {
    out[key] = Math.round(parseFloat(controlHeightTokens[key]) * scale)
  }
  return out
}

export function resolveShadowFactor(config: ThemeConfig): number {
  return config.shadow === 'custom' ? config.shadowIntensity / 100 : SHADOW_PRESET[config.shadow]
}

/**
 * 按强度系数重算一条阴影。
 *
 * 透明度与模糊/位移分开处理：系数放大时只提高透明度会得到一块生硬的黑边，
 * 同时放大模糊半径才像是「光源更远」。模糊按平方根增长，避免强档糊成一团。
 */
export function scaleShadow(value: string, factor: number): string {
  if (factor <= 0) return 'none'
  const blur = Math.sqrt(factor)
  return value
    .replace(/rgba\(([^)]+)\)/g, (_, inner: string) => {
      const parts = inner.split(',').map((p) => p.trim())
      const alpha = clamp(parseFloat(parts[3] ?? '1') * factor, 0, 0.92)
      return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${Number(alpha.toFixed(3))})`
    })
    .replace(/(-?\d*\.?\d+)px/g, (_, n: string) => `${Math.round(parseFloat(n) * blur * 10) / 10}px`)
}

export function resolveShadows(config: ThemeConfig, mode: ThemeMode): Record<ShadowKey, string> {
  const base = mode === 'dark' ? shadowDarkTokens : shadowTokens
  const factor = resolveShadowFactor(config)
  const out = {} as Record<ShadowKey, string>
  for (const key of Object.keys(base) as ShadowKey[]) out[key] = scaleShadow(base[key], factor)
  return out
}

/* ------------------------------------------------------------------ 中性色 */

/**
 * 中性色带一点主题色的色相。
 *
 * 纯灰的界面在饱和主题色旁边会显得发脏，这是同时对比造成的错觉；
 * 给中性面与文字掺入同色相的一点点彩度即可消掉。
 * 只动彩度、不动明度：明度一变，所有基于灰阶算好的对比度就全部作废。
 */
const NEUTRAL_KEYS = [
  'color-bg',
  'color-bg-elevated',
  'color-bg-subtle',
  'color-bg-muted',
  'color-border',
  'color-border-strong',
  'color-text',
  'color-text-secondary',
  'color-text-tertiary'
] as const

export function tintNeutrals(
  brand: string,
  strength: number,
  mode: ThemeMode
): Record<string, string> {
  const out: Record<string, string> = {}
  if (strength <= 0) return out
  const { h } = rgbToOklch(hexToRgb(brand))
  const chroma = (strength / 100) * 0.022
  const source = mode === 'dark' ? darkTheme : lightTheme
  for (const key of NEUTRAL_KEYS) {
    const value = source[key]
    if (!isHex(value)) continue
    const { l } = rgbToOklch(hexToRgb(value))
    // 文字上的彩度要更收着：正文带上明显色相会读作「链接」
    const c = key.startsWith('color-text') ? chroma * 0.5 : chroma
    out[key] = rgbToHex(oklchToRgb({ l, c, h }))
  }
  return out
}

/* ------------------------------------------------------------------ 汇总 */

/** 面板上要显示的语义色，顺序即面板顺序 */
export const SEMANTIC_COLOR_KEYS = ['success', 'warning', 'danger'] as const
export type SemanticColorKey = (typeof SEMANTIC_COLOR_KEYS)[number]

/**
 * 一次算出全部要覆盖的令牌。键名不带前缀，调用方自行拼 `--i-`。
 * 值为空字符串表示「删掉这条覆盖，回到编译出的默认值」。
 */
export function resolveThemeTokens(
  config: ThemeConfig,
  mode: ThemeMode = 'light'
): Record<string, string> {
  const out: Record<string, string> = {}
  const ramp = brandRamp(config.brand, mode)

  out['color-brand'] = ramp.brand
  out['color-brand-hover'] = ramp.hover
  out['color-brand-active'] = ramp.active
  out['color-brand-subtle'] = ramp.subtle
  out['shadow-brand'] = scaleShadow(ramp.shadow, resolveShadowFactor(config))
  out['gradient-brand'] = ramp.gradient
  out['color-text-on-brand'] = ramp.onBrand
  out['color-text-link'] = ramp.brand
  out['color-info'] = ramp.brand
  out['color-info-subtle'] = ramp.subtle

  for (const key of SEMANTIC_COLOR_KEYS) {
    const semantic = brandRamp(config[key], mode)
    out[`color-${key}`] = semantic.brand
    out[`color-${key}-subtle`] = semantic.subtle
  }

  Object.assign(out, tintNeutrals(config.brand, config.neutralTint, mode))

  for (const [key, value] of Object.entries(resolveFontSizes(config))) {
    out[`font-size-${key}`] = px(value)
  }
  out['line-height-base'] = lineHeightTokens[config.lineHeight]
  out['font-family'] =
    config.fontFamily === 'system' ? '' : config.fontFamily === 'serif' ? SERIF_STACK : 'var(--i-font-family-mono)'

  for (const [key, value] of Object.entries(resolveRadii(config))) out[`radius-${key}`] = px(value)

  for (const [key, value] of Object.entries(resolveShadows(config, mode))) {
    if (key !== 'brand') out[`shadow-${key}`] = value
  }

  for (const [key, value] of Object.entries(resolveSpacing(config))) out[`spacing-${key}`] = px(value)
  for (const [key, value] of Object.entries(resolveControlHeights(config))) {
    out[`control-height-${key}`] = px(value)
  }

  // 关掉动效时把时长压到 0：组件全部引用这几个令牌，因此一处生效
  const speed = config.motion ? MOTION_SPEED[config.motionSpeed] : 0
  for (const key of ['fast', 'base', 'slow'] as const) {
    out[`motion-${key}`] =
      speed === 0 ? '0ms' : speed === 1 ? '' : `${Math.round(parseFloat(motionTokens[key]) * speed)}ms`
  }

  return out
}

/** 导出成可以直接贴进项目的 CSS。空值（回落到默认）不导出 */
export function themeConfigToCss(config: ThemeConfig, mode: ThemeMode = 'light'): string {
  const tokens = resolveThemeTokens(config, mode)
  const lines = Object.entries(tokens)
    .filter(([, value]) => value !== '')
    .map(([key, value]) => `  --i-${key}: ${value};`)
  const selector = mode === 'dark' ? ':root[data-theme="dark"]' : ':root'
  return `${selector} {\n${lines.join('\n')}\n}`
}
