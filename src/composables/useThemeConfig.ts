import { computed, reactive, watch } from 'vue'
import { brandRamp } from '@i-design/common'

/**
 * 站点主题配置：把用户在配置面板里的选择实时写进 :root 的 CSS 变量。
 *
 * 这套体系本来就是「组件只引用语义令牌」，所以换肤不需要改任何组件代码——
 * 覆盖变量即可。这个面板同时也是对那条架构约定的验证：
 * 如果哪个组件写死了颜色或圆角，在这里一调就会露馅。
 */

export type ScaleLevel = 'compact' | 'default' | 'loose'

export interface ThemeConfig {
  brand: string
  /** 圆角档位倍率 */
  radius: ScaleLevel
  /** 字号档位倍率 */
  fontSize: ScaleLevel
  /** 关掉后所有过渡与动画立即停止，等同于系统的「减少动态效果」 */
  motion: boolean
  /** 明暗切换的动效：圆形揭幕 / 渐暗渐亮 / 直接切换 */
  themeTransition: 'reveal' | 'dim' | 'none'
}

const STORAGE_KEY = 'i-design-theme-config'

export const PRESET_BRANDS = [
  { value: '#5e7ce0', label: '默认蓝' },
  { value: '#0052d9', label: '科技蓝' },
  { value: '#0f8a68', label: '松石绿' },
  { value: '#7a4ee0', label: '深空紫' },
  { value: '#d64f8d', label: '品红' },
  { value: '#b7622a', label: '琥珀棕' },
  { value: '#c2413d', label: '朱砂红' },
  { value: '#1d2129', label: '中性黑' }
]

/* 三档缩放。圆角与字号分开控制：有人想要圆润的卡片配紧凑的字，反之亦然 */
const RADIUS_SCALE: Record<ScaleLevel, number> = { compact: 0.5, default: 1, loose: 2 }
const FONT_SCALE: Record<ScaleLevel, number> = { compact: 0.92, default: 1, loose: 1.15 }

/** 基准值取自编译出的令牌，缩放在此基础上做 */
const RADIUS_BASE = { sm: 2, md: 4, lg: 8, xl: 16 }
const FONT_BASE = { xs: 12, sm: 13, md: 14, lg: 16, xl: 20, '2xl': 24, '3xl': 32, '4xl': 44, '5xl': 56 }

const DEFAULTS: ThemeConfig = {
  brand: '#5e7ce0',
  radius: 'default',
  fontSize: 'default',
  motion: true,
  themeTransition: 'reveal'
}

function load(): ThemeConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULTS }
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<ThemeConfig>) }
  } catch {
    // 隐私模式下 localStorage 会直接抛错，配置读不出来不该让整站崩掉
    return { ...DEFAULTS }
  }
}

export const themeConfig = reactive<ThemeConfig>(load())

/** 当前主题色推导出的完整色阶，面板上要显示对比度告警 */
export const currentRamp = computed(() => brandRamp(themeConfig.brand, currentMode()))

function currentMode(): 'light' | 'dark' {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

/**
 * 把配置写进 :root。
 *
 * 写行内 style 而不是插一个 <style> 标签：行内优先级高于任何样式表，
 * 不必和 tokens.css 比谁写在后面；也便于「恢复默认」时逐个删掉。
 */
export function applyThemeConfig() {
  const root = document.documentElement
  const ramp = brandRamp(themeConfig.brand, currentMode())

  root.style.setProperty('--i-color-brand', ramp.brand)
  root.style.setProperty('--i-color-brand-hover', ramp.hover)
  root.style.setProperty('--i-color-brand-active', ramp.active)
  root.style.setProperty('--i-color-brand-subtle', ramp.subtle)
  root.style.setProperty('--i-shadow-brand', ramp.shadow)
  root.style.setProperty('--i-gradient-brand', ramp.gradient)
  root.style.setProperty('--i-color-text-on-brand', ramp.onBrand)

  const radius = RADIUS_SCALE[themeConfig.radius]
  for (const [key, base] of Object.entries(RADIUS_BASE)) {
    root.style.setProperty(`--i-radius-${key}`, `${Math.round(base * radius)}px`)
  }

  const font = FONT_SCALE[themeConfig.fontSize]
  for (const [key, base] of Object.entries(FONT_BASE)) {
    root.style.setProperty(`--i-font-size-${key}`, `${Math.round(base * font)}px`)
  }

  // 关掉动效时把时长压到 0：组件全部引用这两个令牌，因此一处生效
  root.style.setProperty('--i-motion-fast', themeConfig.motion ? '' : '0ms')
  root.style.setProperty('--i-motion-base', themeConfig.motion ? '' : '0ms')
  root.style.setProperty('--i-motion-slow', themeConfig.motion ? '' : '0ms')

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(themeConfig))
  } catch {
    // 存不下就算了，本次会话内仍然生效
  }
}

export function resetThemeConfig() {
  Object.assign(themeConfig, DEFAULTS)
}

let started = false
export function useThemeConfig() {
  if (!started) {
    started = true
    applyThemeConfig()
    watch(themeConfig, applyThemeConfig, { deep: true })
    // 明暗切换后品牌色阶要重新推导：暗色下 subtle 是深色而不是浅色
    new MutationObserver(applyThemeConfig).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    })
  }
  return { themeConfig, currentRamp, resetThemeConfig }
}
