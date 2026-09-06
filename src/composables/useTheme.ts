import { ref, watchEffect } from 'vue'

export type ThemeName = 'light' | 'dark'

const STORAGE_KEY = 'i-design-theme'

function readInitialTheme(): ThemeName {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** 全局单例，保证多处调用共享同一主题状态 */
const theme = ref<ThemeName>(typeof window === 'undefined' ? 'light' : readInitialTheme())

export function useTheme() {
  watchEffect(() => {
    document.documentElement.dataset.theme = theme.value
    localStorage.setItem(STORAGE_KEY, theme.value)
  })

  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  return { theme, toggleTheme }
}
