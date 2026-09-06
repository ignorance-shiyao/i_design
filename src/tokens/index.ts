/**
 * Ignorance Design —— 设计令牌（Design Tokens）
 *
 * 令牌分三层：
 *   1. 基础层 basic：调色板与原子刻度，只描述"值"，不描述"用途"。
 *   2. 语义层 semantic：把基础层映射到用途（品牌色、文本色、边框色…）。
 *   3. 组件层：由组件自行消费语义层变量，见各组件样式。
 *
 * 所有令牌最终会被 `toCssVariables()` 展开为 CSS 自定义属性，
 * 主题切换只需覆盖语义层，无需改动组件。
 */

export interface Palette {
  [scale: string]: string
}

/** 基础调色板：每色 9 阶，10 最浅、90 最深 */
export const palette: Record<string, Palette> = {
  brand: {
    10: '#eef3ff',
    20: '#d6e2ff',
    30: '#adc4ff',
    40: '#7ea1ff',
    50: '#5e7ce0', // 主品牌色
    60: '#4a63c4',
    70: '#3a4da3',
    80: '#2b3a80',
    90: '#1d275c'
  },
  gray: {
    10: '#ffffff',
    20: '#f7f8fa',
    30: '#eef0f5',
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

/** 字号刻度：以 14px 正文为基准的模块化比例 */
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

export const lineHeight = {
  tight: '1.25',
  base: '1.6',
  loose: '1.8'
} as const

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
  sm: '0 1px 2px rgba(20, 24, 34, 0.06)',
  md: '0 4px 12px rgba(20, 24, 34, 0.08)',
  lg: '0 8px 28px rgba(20, 24, 34, 0.12)',
  xl: '0 16px 48px rgba(20, 24, 34, 0.16)'
} as const

export const motion = {
  fast: '120ms',
  base: '200ms',
  slow: '320ms',
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
} as const

export const zIndex = {
  base: '0',
  dropdown: '1000',
  sticky: '1100',
  modal: '1300',
  toast: '1500'
} as const

/** 语义层：亮色主题 */
export const lightTheme = {
  'color-brand': palette.brand[50],
  'color-brand-hover': palette.brand[40],
  'color-brand-active': palette.brand[60],
  'color-brand-subtle': palette.brand[10],

  'color-bg': palette.gray[10],
  'color-bg-subtle': palette.gray[20],
  'color-bg-muted': palette.gray[30],
  'color-bg-inverse': palette.gray[90],

  'color-text': palette.gray[80],
  'color-text-secondary': palette.gray[70],
  'color-text-tertiary': palette.gray[60],
  'color-text-inverse': palette.gray[10],
  'color-text-link': palette.brand[50],

  'color-border': palette.gray[40],
  'color-border-strong': palette.gray[50],

  'color-success': palette.success[50],
  'color-success-subtle': palette.success[10],
  'color-warning': palette.warning[50],
  'color-warning-subtle': palette.warning[10],
  'color-danger': palette.danger[50],
  'color-danger-subtle': palette.danger[10],
  'color-info': palette.info[50],
  'color-info-subtle': palette.info[10]
} as const

/** 语义层：暗色主题（仅覆盖语义变量，组件无需改动） */
export const darkTheme: Record<keyof typeof lightTheme, string> = {
  'color-brand': palette.brand[40],
  'color-brand-hover': palette.brand[30],
  'color-brand-active': palette.brand[50],
  'color-brand-subtle': 'rgba(94, 124, 224, 0.16)',

  'color-bg': '#171b26',
  'color-bg-subtle': '#1e2330',
  'color-bg-muted': '#272d3d',
  'color-bg-inverse': palette.gray[20],

  'color-text': '#e6e8ef',
  'color-text-secondary': '#b3b8c6',
  'color-text-tertiary': '#8a8e99',
  'color-text-inverse': palette.gray[90],
  'color-text-link': palette.brand[30],

  'color-border': '#333a4d',
  'color-border-strong': '#454d63',

  'color-success': palette.success[50],
  'color-success-subtle': 'rgba(58, 194, 149, 0.16)',
  'color-warning': palette.warning[50],
  'color-warning-subtle': 'rgba(250, 152, 65, 0.16)',
  'color-danger': palette.danger[50],
  'color-danger-subtle': 'rgba(246, 111, 106, 0.16)',
  'color-info': palette.info[50],
  'color-info-subtle': 'rgba(94, 124, 224, 0.16)'
}

/** 把一组令牌展开为 `--i-*` CSS 变量声明 */
export function toCssVariables(tokens: Record<string, string>, prefix = 'i'): string {
  return Object.entries(tokens)
    .map(([key, value]) => `--${prefix}-${key}: ${value};`)
    .join('\n  ')
}
