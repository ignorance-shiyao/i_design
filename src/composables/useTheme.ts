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

type Point = { x: number; y: number }

/**
 * 明暗切换的揭幕动画。
 *
 * 用 View Transitions 做圆形扩散，而不是给整页加一层淡入淡出：
 * 淡入淡出只是「颜色变了」，圆形揭幕能让人看出是从哪个开关按下去的——
 * 动效的作用是解释因果，不是装饰。
 *
 * 不支持 View Transitions 的浏览器直接切换，功能不受影响。
 */
function runWithTransition(origin: Point | undefined, mutate: () => void) {
  const doc = document as Document & {
    startViewTransition?: (cb: () => void) => { ready: Promise<void> }
  }
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (!doc.startViewTransition || reduced || !origin) {
    mutate()
    return
  }

  const transition = doc.startViewTransition(mutate)
  transition.ready.then(() => {
    // 半径取到最远的那个角，否则页面角落会留下没被覆盖的一块
    const radius = Math.hypot(
      Math.max(origin.x, window.innerWidth - origin.x),
      Math.max(origin.y, window.innerHeight - origin.y)
    )
    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${origin.x}px ${origin.y}px)`,
          `circle(${radius}px at ${origin.x}px ${origin.y}px)`
        ]
      },
      {
        duration: 480,
        easing: 'cubic-bezier(0, 0, 0.2, 1)',
        // 只动新页面那一层：旧层留在原地当底衬，新层像幕布一样拉开
        pseudoElement: '::view-transition-new(root)'
      }
    )
  })
}

export function useTheme() {
  watchEffect(() => {
    document.documentElement.dataset.theme = theme.value
    localStorage.setItem(STORAGE_KEY, theme.value)
  })

  /** 传入触发元素的坐标，揭幕就从那里展开 */
  const toggleTheme = (origin?: Point) => {
    runWithTransition(origin, () => {
      theme.value = theme.value === 'light' ? 'dark' : 'light'
    })
  }

  return { theme, toggleTheme }
}
