import { ref, watchEffect } from "vue";

export type ThemeName = "light" | "dark";

const STORAGE_KEY = "i-design-theme";

function readInitialTheme(): ThemeName {
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch {
    /* 私密模式仍可切换 */
  }
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/** 全局单例，保证多处调用共享同一主题状态 */
const theme = ref<ThemeName>(
  typeof window === "undefined" ? "light" : readInitialTheme()
);

type Point = { x: number; y: number };

/** 切换动效：圆形揭幕 / 渐暗渐亮 / 不要动效 */
export type ThemeTransition = "reveal" | "dim" | "none";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
 * 变暗比变亮快：现实里关灯是瞬间的，亮起来才需要预热。
 */
async function runDim(mutate: () => void) {
  const veil = document.createElement("div");
  veil.className = "i-theme-veil";
  veil.setAttribute("aria-hidden", "true");
  document.body.appendChild(veil);

  try {
    await veil.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 200,
      easing: "cubic-bezier(0.4, 0, 1, 1)",
      fill: "forwards",
    }).finished;
    mutate();
    // 全黑处停一下，眼睛才来得及读出「灭了」这个状态
    await sleep(90);
    await veil.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 420,
      easing: "cubic-bezier(0, 0, 0.2, 1)",
    }).finished;
  } finally {
    // 动画被打断（快速连点）也要收掉遮罩，否则整页留一层黑
    veil.remove();
  }
}

function runWithTransition(origin: Point | undefined, mutate: () => void) {
  const doc = document as Document & {
    startViewTransition?: (cb: () => void) => { ready: Promise<void> };
  };
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!doc.startViewTransition || reduced || !origin) {
    mutate();
    return;
  }

  const transition = doc.startViewTransition(mutate);
  transition.ready.then(() => {
    // 半径取到最远的那个角，否则页面角落会留下没被覆盖的一块
    const radius = Math.hypot(
      Math.max(origin.x, window.innerWidth - origin.x),
      Math.max(origin.y, window.innerHeight - origin.y)
    );
    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${origin.x}px ${origin.y}px)`,
          `circle(${radius}px at ${origin.x}px ${origin.y}px)`,
        ],
      },
      {
        duration: 480,
        easing: "cubic-bezier(0, 0, 0.2, 1)",
        // 只动新页面那一层：旧层留在原地当底衬，新层像幕布一样拉开
        pseudoElement: "::view-transition-new(root)",
      }
    );
  });
}

export function useTheme() {
  watchEffect(() => {
    document.documentElement.dataset.theme = theme.value;
    try {
      localStorage.setItem(STORAGE_KEY, theme.value);
    } catch {
      /* 会话内仍然生效 */
    }
  });

  /**
   * 切换主题。
   * origin 是触发元素的坐标，圆形揭幕从那里展开；
   * style 决定用哪种动效，由主题配置面板给出。
   */
  const toggleTheme = (origin?: Point, style: ThemeTransition = "reveal") => {
    const mutate = () => {
      theme.value = theme.value === "light" ? "dark" : "light";
    };
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (
      style === "none" ||
      reduced ||
      document.documentElement.dataset.motion === "off"
    ) {
      mutate();
      return;
    }
    if (style === "dim") {
      runDim(mutate);
      return;
    }
    runWithTransition(origin, mutate);
  };

  return { theme, toggleTheme };
}
