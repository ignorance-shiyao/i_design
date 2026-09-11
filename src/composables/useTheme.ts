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

/** 切换动效：圆形揭幕 / 渐暗渐亮 / 不要动效 */
export type ThemeTransition = 'reveal' | 'dim' | 'none'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * 明暗切换的揭幕动画。
 *
 * 用 View Transitions 做圆形扩散，而不是给整页加一层淡入淡出：
 * 淡入淡出只是「颜色变了」，圆形揭幕能让人看出是从哪个开关按下去的——
 * 动效的作用是解释因果，不是装饰。
 *
 * 不支持 View Transitions 的浏览器直接切换，功能不受影响。
 */
/**
 * 渐暗渐亮：像拉下再推上一个调光开关。
 *
 * 整屏压到全黑的瞬间才换主题——因为「灯灭的那一刻看不见东西」本身就是掩护，
 * 主题切换的突变藏在里面，用户感知到的是灯在变暗和变亮，而不是颜色跳了一下。
 * 变暗比变亮快，但也不能快到像闪了一下：现实里关灯是一瞬，
 * 亮起来却要预热，所以下行 420ms、上行 760ms。
 */
async function runDim(mutate: () => void) {
  const veil = document.createElement('div')
  veil.className = 'i-theme-veil'
  veil.setAttribute('aria-hidden', 'true')
  document.body.appendChild(veil)

  try {
    await veil.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 420,
      easing: 'cubic-bezier(0.4, 0, 0.6, 1)',
      fill: 'forwards'
    }).finished
    mutate()
    // 全黑处停一下，眼睛才来得及读出「灭了」这个状态
    await sleep(120)
    await veil.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 760,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    }).finished
  } finally {
    // 动画被打断（快速连点）也要收掉遮罩，否则整页留一层黑
    veil.remove()
  }
}

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

    /*
     * 用 clip-path 扩散。
     *
     * 这里试过用羽化边的 mask-image 做出「光漫开」的软边，结果是：
     * view-transition 的伪元素只接受很小一组可动属性（transform / opacity /
     * width / height / backdrop-filter / mix-blend-mode / clip-path），
     * mask-image 不在其中——WAAPI 既不报错也不生效，那条关键帧被直接丢掉，
     * 屏幕上剩下的是浏览器默认的 250ms 淡入淡出。
     * 「看起来没生效」的原因是属性被静默忽略，不是时长或曲线没调好。
     */
    document.documentElement.animate(
      {
        // 起点不是 0：从开关本身那么大开始，看起来才像光是从按钮里透出来的
        clipPath: [
          `circle(16px at ${origin.x}px ${origin.y}px)`,
          `circle(${radius}px at ${origin.x}px ${origin.y}px)`
        ]
      },
      {
        /*
         * 900ms，刻意越过「动效不超过 320ms」那条线。
         *
         * 那条线管的是点一下要立刻有回应的操作；而这里整屏的明暗在变，
         * 走快了就只是闪一下，眼睛还没适应就结束了。开灯本来就有个过程。
         */
        duration: 900,
        /*
         * 起步慢、越往外越快。
         *
         * 匀速或者「快进慢停」都不像开灯：前者是一块板子匀速推过去，
         * 后者一上来就冲到大半屏，按钮那头反而看不清是从哪儿起的。
         * 慢起步让人看清光是从开关里出来的，中段加速则对应「离焦点越远铺得越开」。
         */
        easing: 'cubic-bezier(0.55, 0, 0.25, 1)',
        // 只动新主题那一层：旧层留在原地当底衬，新层像光一样漫上来
        pseudoElement: '::view-transition-new(root)'
      }    )
  })
}

export function useTheme() {
  watchEffect(() => {
    document.documentElement.dataset.theme = theme.value
    localStorage.setItem(STORAGE_KEY, theme.value)
  })

  /**
   * 切换主题。
   * origin 是触发元素的坐标，圆形揭幕从那里展开；
   * style 决定用哪种动效，由主题配置面板给出。
   */
  const toggleTheme = (origin?: Point, style: ThemeTransition = 'reveal') => {
    const mutate = () => {
      theme.value = theme.value === 'light' ? 'dark' : 'light'
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (style === 'none' || reduced) {
      mutate()
      return
    }
    if (style === 'dim') {
      runDim(mutate)
      return
    }
    runWithTransition(origin, mutate)
  }

  return { theme, toggleTheme }
}
