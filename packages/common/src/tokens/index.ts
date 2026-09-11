/**
 * Ignorance Design —— 设计令牌（跨端单一数据源）
 *
 * 这里是整个体系唯一的「值」的来源。Web 端消费编译出的 CSS 变量，
 * 小程序消费 WXSS 变量，Flutter 消费生成的 Dart 常量——它们都由本文件编译得到，
 * 因此不存在「某端的蓝色跟别人差一点」这种问题。
 *
 * 令牌分三层：
 *   1. 基础层 palette / scale：只描述值，不描述用途。
 *   2. 语义层 semantic：把基础层映射到用途，主题切换只覆盖这一层。
 *   3. 组件层：由各框架的组件消费语义层，不出现硬编码值。
 */

import { contrastText } from '../logic/palette'

export type Palette = Record<string, string>

/** 基础调色板：每色 9 阶，10 最浅、90 最深 */
export const palette: Record<string, Palette> = {
  brand: {
    10: '#eef3ff',
    20: '#d6e2ff',
    30: '#adc4ff',
    40: '#7ea1ff',
    50: '#5e7ce0',
    60: '#4a63c4',
    70: '#3a4da3',
    80: '#2b3a80',
    90: '#1d275c'
  },
  gray: {
    10: '#ffffff',
    /*
     * 15 是页面底色，专门加进来的一档。
     *
     * 在这之前页面底色与浮起面同为 #ffffff，卡片、弹层、输入框放上去完全没有分界，
     * 全靠一条极淡的发丝线撑着——整页于是像压平的一张纸，层级关系读不出来。
     * 深色模式一直是分开的（#171b26 对 #1f2431），浅色这边只是没跟上。
     * 差值给得很小：底色仍然读作白，但浮起面一放上去就浮得起来。
     */
    15: '#f8f9fb',
    20: '#f1f3f7',
    30: '#e7eaf1',
    40: '#dfe1e6',
    50: '#c3c6cd',
    60: '#8a8e99',
    70: '#575d6c',
    80: '#252b3a',
    90: '#141822'
  },
  success: { 10: '#e8f8f0', 50: '#3ac295', 70: '#26996f' },
  warning: { 10: '#fff4e6', 50: '#fa9841', 70: '#c9762c' },
  danger: { 10: '#fdecee', 50: '#f66f6a', 70: '#cc4b46' },
  info: { 10: '#eef3ff', 50: '#5e7ce0', 70: '#3a4da3' }
}

/**
 * 图表分类色：8 个色相，固定顺序，按序分配，绝不循环使用。
 *
 * 顺序本身就是色觉安全机制，因此不能随意调换：这组取值与排序经过校验——
 * 明暗两种底色下都落在合规亮度带内，相邻色在红绿色觉模拟下的色差达到阈值，
 * 且每个色对纯白/深色底的对比度都不低于 3:1。
 *
 * 第 9 个系列不是「再生成一个颜色」：那会破坏上面这组保证。
 * 超过 8 个系列时应当合并为「其他」，或改用分面小图。
 */
export const chartCategorical = [
  '#5e7ce0', // 1 品牌蓝：第一系列永远是它，图表与产品同一个识别色
  '#b7622a', // 2 橙
  '#0f8a68', // 3 绿
  '#7a4ee0', // 4 紫
  '#d64f8d', // 5 粉
  '#1f86b8', // 6 青
  '#b08a1e', // 7 金
  '#c2413d' // 8 红
] as const

/**
 * 顺序色阶：表示「多少」，同一色相由浅到深。
 * 与分类色不同，它编码的是量级，因此不能用多色相彩虹。
 */
export const chartSequential = ['#eef3ff', '#adc4ff', '#7ea1ff', '#5e7ce0', '#3a4da3'] as const

/**
 * 双向色阶：表示「偏向哪一侧」，两端两个色相，中点为中性灰。
 * 中点必须是灰：任何有色中点都会让「零」看起来像一种倾向。
 */
export const chartDiverging = ['#c2413d', '#e8a09e', '#dfe1e6', '#8fb0e8', '#3a4da3'] as const

/**
 * 双向色阶的暗色步进。
 *
 * 不是把亮色那套直接搬过来——亮色的冷极 #3a4da3 在深色背景上明度只有 0.45，
 * 对比度 2.3:1，柱子几乎看不见。这里按同样的色相重新取步进，
 * 落在暗色的明度带（0.48–0.67）内，并保住彩度下限；
 * 中点也一并压暗，否则浅灰中点会比两极还亮，「零」反而成了最抢眼的位置。
 */
export const chartDivergingDark = ['#de3c3b', '#8f4a48', '#3a3f4d', '#3f5599', '#5671f5'] as const

/** 字号刻度：以 14px 正文为基准 */
export const fontSize = {
  xs: '12px',
  sm: '13px',
  md: '14px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '32px',
  '4xl': '44px',
  '5xl': '56px'
} as const

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700'
} as const

export const lineHeight = { tight: '1.25', base: '1.6', loose: '1.8' } as const

/** 间距刻度：4px 基准栅格 */
export const spacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px'
} as const

export const radius = {
  none: '0px',
  sm: '2px',
  md: '4px',
  lg: '8px',
  xl: '16px',
  full: '999px'
} as const

export const shadow = {
  sm: '0 1px 2px rgba(20, 24, 34, 0.05), 0 1px 1px rgba(20, 24, 34, 0.03)',
  md: '0 2px 4px rgba(20, 24, 34, 0.04), 0 8px 20px -6px rgba(20, 24, 34, 0.1)',
  lg: '0 4px 8px rgba(20, 24, 34, 0.04), 0 16px 40px -12px rgba(20, 24, 34, 0.16)',
  xl: '0 8px 16px rgba(20, 24, 34, 0.06), 0 32px 64px -16px rgba(20, 24, 34, 0.22)',
  brand: '0 8px 24px -8px rgba(94, 124, 224, 0.5)'
} as const

export const shadowDark = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.5)',
  md: '0 2px 4px rgba(0, 0, 0, 0.4), 0 8px 20px -6px rgba(0, 0, 0, 0.55)',
  lg: '0 4px 8px rgba(0, 0, 0, 0.4), 0 16px 40px -12px rgba(0, 0, 0, 0.6)',
  xl: '0 8px 16px rgba(0, 0, 0, 0.45), 0 32px 64px -16px rgba(0, 0, 0, 0.7)',
  brand: '0 8px 24px -8px rgba(94, 124, 224, 0.55)'
} as const

/*
 * 动效令牌。
 *
 * 曲线分进场与出场两条，而不是一律用同一条——
 * 元素出现时应当「快进慢停」（decelerate），让人看清它停在哪里；
 * 消失时应当「慢起快走」（accelerate），因为没人需要看清一个正在离开的东西。
 * 两边用同一条对称曲线是最常见的动效毛病：出现显得迟钝，消失显得拖沓。
 */
export const motion = {
  fast: '120ms',
  base: '200ms',
  slow: '320ms',
  /** 通用曲线，用于颜色、边框这类没有方向感的属性 */
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  /** 进场：快进慢停 */
  'easing-out': 'cubic-bezier(0, 0, 0.2, 1)',
  /** 出场：慢起快走 */
  'easing-in': 'cubic-bezier(0.4, 0, 1, 1)',
  /** 轻微回弹，用于按压反馈与拖拽落位这类需要「手感」的动作 */
  'easing-spring': 'cubic-bezier(0.34, 1.36, 0.64, 1)'
} as const

export const zIndex = {
  base: '0',
  dropdown: '1000',
  sticky: '1100',
  modal: '1300',
  toast: '1500'
} as const

export const fontFamily = {
  base:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', " +
    "'Microsoft YaHei', Roboto, 'Helvetica Neue', Arial, sans-serif",
  mono: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace"
} as const

/** 语义层：亮色 */
export const lightTheme: Record<string, string> = {
  'color-brand': palette.brand[50],
  'color-brand-hover': palette.brand[40],
  'color-brand-active': palette.brand[60],
  'color-brand-subtle': palette.brand[10],

  'color-bg': palette.gray[15],
  'color-bg-elevated': '#ffffff',
  'color-bg-subtle': palette.gray[20],
  'color-bg-muted': palette.gray[30],
  'color-bg-inverse': palette.gray[90],

  'color-text': palette.gray[80],
  'color-text-secondary': palette.gray[70],
  'color-text-tertiary': palette.gray[60],
  'color-text-inverse': palette.gray[10],
  /*
   * 压在图片、视频上的前景色。明暗两个主题都是白——
   * 它面对的不是主题底色而是任意媒体内容，跟着主题翻会在暗色主题下变成
   * 深色的点压在深色照片上，直接消失。
   */
  'color-on-media': '#ffffff',
  'color-text-link': palette.brand[50],

  'color-border': palette.gray[40],
  'color-border-strong': palette.gray[50],
  // 0.08 在多数屏幕上已经看不见了，只是名义上有条线
  'color-hairline': 'rgba(20, 24, 34, 0.11)',
  'color-ring': 'rgba(94, 124, 224, 0.18)',

  'color-success': palette.success[50],
  'color-success-subtle': palette.success[10],
  'color-warning': palette.warning[50],
  'color-warning-subtle': palette.warning[10],
  'color-danger': palette.danger[50],
  'color-danger-subtle': palette.danger[10],
  'color-info': palette.info[50],
  'color-info-subtle': palette.info[10],

  'color-code-bg': '#fbfbfd',
  'color-code-bar': '#f4f5f9',
  'color-code-border': '#e6e8f0',
  'color-code-text': '#2b3245',
  'color-code-muted': '#9aa0ae'
}

/** 语义层：暗色（只覆盖语义层，组件零改动） */
export const darkTheme: Record<string, string> = {
  'color-brand': palette.brand[40],
  'color-brand-hover': palette.brand[30],
  'color-brand-active': palette.brand[50],
  'color-brand-subtle': 'rgba(94, 124, 224, 0.16)',

  'color-bg': '#171b26',
  'color-bg-elevated': '#1f2431',
  'color-bg-subtle': '#1e2330',
  'color-bg-muted': '#272d3d',
  'color-bg-inverse': palette.gray[20],

  'color-text': '#e6e8ef',
  'color-text-secondary': '#b3b8c6',
  'color-text-tertiary': palette.gray[60],
  'color-text-inverse': palette.gray[90],
  'color-on-media': '#ffffff',
  'color-text-link': palette.brand[30],

  'color-border': '#333a4d',
  'color-border-strong': '#454d63',
  'color-hairline': 'rgba(255, 255, 255, 0.08)',
  'color-ring': 'rgba(126, 161, 255, 0.24)',

  'color-success': palette.success[50],
  'color-success-subtle': 'rgba(58, 194, 149, 0.16)',
  'color-warning': palette.warning[50],
  'color-warning-subtle': 'rgba(250, 152, 65, 0.16)',
  'color-danger': palette.danger[50],
  'color-danger-subtle': 'rgba(246, 111, 106, 0.16)',
  'color-info': palette.info[50],
  'color-info-subtle': 'rgba(94, 124, 224, 0.16)',

  'color-code-bg': '#12151e',
  'color-code-bar': '#171b26',
  'color-code-border': '#262c3a',
  'color-code-text': '#d6dae6',
  'color-code-muted': '#6b7385'
}

/** 语法高亮 token 色，亮暗各一套 */
export const syntaxLight: Record<string, string> = {
  'tok-comment': '#9aa0ae',
  'tok-keyword': '#7048e8',
  'tok-string': '#0f766e',
  'tok-number': '#b45309',
  'tok-literal': '#b45309',
  'tok-fn': '#2563a8',
  'tok-klass': '#0f766e',
  'tok-prop': '#2563a8',
  'tok-tag': '#d6336c',
  'tok-attr': '#b45309',
  'tok-directive': '#7048e8',
  'tok-punct': '#7c8496'
}

export const syntaxDark: Record<string, string> = {
  'tok-comment': '#6b7385',
  'tok-keyword': '#b197fc',
  'tok-string': '#5fd3b5',
  'tok-number': '#ffb86b',
  'tok-literal': '#ffb86b',
  'tok-fn': '#82aaff',
  'tok-klass': '#5fd3b5',
  'tok-prop': '#82aaff',
  'tok-tag': '#ff86b3',
  'tok-attr': '#ffb86b',
  'tok-directive': '#b197fc',
  'tok-punct': '#8a93a8'
}

export const gradient = {
  brand: 'linear-gradient(135deg, #6d8bff 0%, #5e7ce0 50%, #4a63c4 100%)',
  surface: 'linear-gradient(180deg, #ffffff 0%, #f9fafc 100%)'
} as const

export const gradientDark = {
  brand: 'linear-gradient(135deg, #8fadff 0%, #6d8bff 50%, #5e7ce0 100%)',
  surface: 'linear-gradient(180deg, #1e2330 0%, #191d28 100%)'
} as const

/**
 * 移动端覆盖层。
 *
 * 移动端不是「把 Web 组件缩小」：手指的命中面积远大于鼠标指针，正文字号低于 16px
 * 会触发 iOS 的自动缩放，而 hover 在触屏上根本不存在。因此这里只覆盖受这些因素
 * 影响的令牌，颜色与语义完全沿用 Web 端——同一套设计，不同的人机尺度。
 */
export const mobileOverrides: Record<string, string> = {
  // 正文 16px：低于此值 iOS Safari 会在聚焦输入框时自动放大页面
  'font-size-md': '16px',
  'font-size-sm': '14px',
  'font-size-xs': '13px',
  'font-size-lg': '18px',

  // 控件最小高度 44px，来自 Apple HIG 与 Material 的可点击区域下限
  'control-height-sm': '36px',
  'control-height-md': '44px',
  'control-height-lg': '52px',

  // 触屏没有 hover，过渡时长相应缩短，避免点按后有黏滞感
  'motion-fast': '100ms',
  'motion-base': '160ms',

  // 安全区：刘海屏与手势条
  'safe-top': 'env(safe-area-inset-top, 0px)',
  'safe-bottom': 'env(safe-area-inset-bottom, 0px)'
}

/** Web 端的控件高度，供各端统一引用（移动端由覆盖层调大） */
export const controlHeight = {
  sm: '28px',
  md: '34px',
  lg: '42px'
} as const

/** 扁平化后的完整令牌表，供编译器逐平台输出 */
export function flatten(theme: 'light' | 'dark' = 'light'): Record<string, string> {
  const semantic = theme === 'dark' ? darkTheme : lightTheme
  const syntax = theme === 'dark' ? syntaxDark : syntaxLight
  const shadows = theme === 'dark' ? shadowDark : shadow
  const gradients = theme === 'dark' ? gradientDark : gradient

  const out: Record<string, string> = { ...semantic, ...syntax }
  Object.entries(fontSize).forEach(([k, v]) => (out[`font-size-${k}`] = v))
  Object.entries(fontWeight).forEach(([k, v]) => (out[`font-weight-${k}`] = v))
  Object.entries(lineHeight).forEach(([k, v]) => (out[`line-height-${k}`] = v))
  Object.entries(spacing).forEach(([k, v]) => (out[`spacing-${k}`] = v))
  Object.entries(radius).forEach(([k, v]) => (out[`radius-${k}`] = v))
  Object.entries(shadows).forEach(([k, v]) => (out[`shadow-${k}`] = v))
  Object.entries(motion).forEach(([k, v]) => (out[`motion-${k}`] = v))
  Object.entries(zIndex).forEach(([k, v]) => (out[`z-${k}`] = v))
  Object.entries(fontFamily).forEach(([k, v]) => (out[`font-family${k === 'base' ? '' : `-${k}`}`] = v))
  Object.entries(gradients).forEach(([k, v]) => (out[`gradient-${k}`] = v))
  Object.entries(controlHeight).forEach(([k, v]) => (out[`control-height-${k}`] = v))
  chartCategorical.forEach((v, i) => (out[`chart-${i + 1}`] = v))
  chartSequential.forEach((v, i) => (out[`chart-seq-${i + 1}`] = v))
  // 深色档上的文字必须翻成浅色，否则最深的两档（#5e7ce0 / #3a4da3）上的深字读不出来
  chartSequential.forEach((v, i) => (out[`chart-seq-${i + 1}-ink`] = contrastText(v)))
  const diverging = theme === 'dark' ? chartDivergingDark : chartDiverging
  diverging.forEach((v, i) => (out[`chart-div-${i + 1}`] = v))
  return out
}

/** 移动端令牌 = Web 令牌 + 覆盖层 */
export function flattenMobile(theme: 'light' | 'dark' = 'light'): Record<string, string> {
  return { ...flatten(theme), ...mobileOverrides }
}

/** 把令牌表展开为 CSS 自定义属性声明 */
export function toCssVariables(tokens: Record<string, string>, prefix = 'i'): string {
  return Object.entries(tokens)
    .map(([key, value]) => `--${prefix}-${key}: ${value};`)
    .join('\n  ')
}
