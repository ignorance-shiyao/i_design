import { computed, reactive, ref, watch } from "vue";
import {
  DEFAULT_THEME_CONFIG,
  brandRamp,
  normalizeThemeConfig,
  resolveThemeTokens,
  themeConfigToCss,
  type ThemeConfig,
} from "@i-design/common";

/**
 * 站点主题配置：把用户在配置面板里的选择实时写进 :root 的 CSS 变量。
 *
 * 「选择 → 令牌」的换算全部在 `@i-design/common` 的 logic/theme 里，
 * 这里只负责三件与框架有关的事：响应式、写进 DOM、记住到 localStorage。
 *
 * 这套体系本来就是「组件只引用语义令牌」，所以换肤不需要改任何组件代码——
 * 覆盖变量即可。这个面板同时也是对那条架构约定的验证：
 * 如果哪个组件写死了颜色、圆角或间距，在这里一调就会露馅。
 */

export type { ThemeConfig };

const STORAGE_KEY = "i-design-theme-config";

export const PRESET_BRANDS = [
  { value: "#5e7ce0", label: "默认蓝" },
  { value: "#0052d9", label: "科技蓝" },
  { value: "#0f8a68", label: "松石绿" },
  { value: "#7a4ee0", label: "深空紫" },
  { value: "#d64f8d", label: "品红" },
  { value: "#b7622a", label: "琥珀棕" },
  { value: "#c2413d", label: "朱砂红" },
  { value: "#1d2129", label: "中性黑" },
];

/** 语义色的备选：每类给几个常见取值，仍可用取色器自定义 */
export const PRESET_SEMANTICS: Record<string, string[]> = {
  success: ["#3ac295", "#0f8a68", "#2ba471", "#5ac25a"],
  warning: ["#fa9841", "#e37318", "#b7622a", "#d9a10b"],
  danger: ["#f66f6a", "#d54941", "#c2413d", "#e34d59"],
};

function load(): ThemeConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_THEME_CONFIG };
    return normalizeThemeConfig(JSON.parse(raw));
  } catch {
    // 隐私模式下 localStorage 会直接抛错，配置读不出来不该让整站崩掉
    return { ...DEFAULT_THEME_CONFIG };
  }
}

export const themeConfig = reactive<ThemeConfig>(load());

const mode = ref(currentMode());
/** 当前主题色推导出的完整色阶，面板上要显示对比度告警 */
export const currentRamp = computed(() =>
  brandRamp(themeConfig.brand, mode.value)
);
/** 面板「导出」页要展示的 CSS，亮暗两份一起给 */
export const themeCss = computed(
  () =>
    `${themeConfigToCss(themeConfig, "light")}\n\n${themeConfigToCss(
      themeConfig,
      "dark"
    )}`
);

function currentMode(): "light" | "dark" {
  return typeof document !== "undefined" &&
    document.documentElement.dataset.theme === "dark"
    ? "dark"
    : "light";
}

/**
 * 把配置写进 :root。
 *
 * 写行内 style 而不是插一个 <style> 标签：行内优先级高于任何样式表，
 * 不必和 tokens.css 比谁写在后面；也便于「恢复默认」时逐个删掉——
 * 值为空串的令牌直接移除，回到编译出的默认值。
 */
export function applyThemeConfig() {
  const root = document.documentElement;
  mode.value = currentMode();

  for (const [key, value] of Object.entries(
    resolveThemeTokens(themeConfig, mode.value)
  )) {
    if (value === "") root.style.removeProperty(`--i-${key}`);
    else root.style.setProperty(`--i-${key}`, value);
  }
  root.dataset.motion = themeConfig.motion ? "on" : "off";

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(themeConfig));
  } catch {
    // 存不下就算了，本次会话内仍然生效
  }
}

export function resetThemeConfig() {
  Object.assign(themeConfig, structuredClone(DEFAULT_THEME_CONFIG));
}

let started = false;
export function useThemeConfig() {
  if (!started) {
    started = true;
    applyThemeConfig();
    watch(themeConfig, applyThemeConfig, { deep: true });
    // 明暗切换后色阶与阴影要重新推导：暗色下 subtle 是深色而不是浅色
    new MutationObserver(applyThemeConfig).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
  }
  return { themeConfig, currentRamp, themeCss, resetThemeConfig };
}
