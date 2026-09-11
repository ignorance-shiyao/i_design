import assert from "node:assert/strict";
import { build } from "esbuild";

const compiled = await build({
  stdin: {
    contents: `export { darkTheme, syntaxDark } from './packages/common/src/tokens/index.ts'; export { contrastRatio, brandRamp } from './packages/common/src/logic/palette.ts'; export { normalizeThemeConfig } from './packages/common/src/logic/theme.ts'; export * from './src/composables/useThemeConfig.ts';`,
    resolveDir: process.cwd(),
    loader: "ts",
  },
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
  loader: { ".webp": "dataurl", ".svg": "dataurl" },
});
const properties = new Map();
let onThemeChange;
let stored = JSON.stringify({
  brand: "broken",
  radius: "huge",
  fontSize: null,
  motion: "yes",
  themeTransition: "broken",
});
globalThis.document = {
  documentElement: {
    dataset: { theme: "light" },
    // 空值的令牌会被 removeProperty 掉（回到编译出的默认值），
    // 桩实现必须一并支持，否则测的就不是真实写入路径
    style: {
      setProperty: (k, v) => properties.set(k, v),
      removeProperty: (k) => properties.delete(k),
    },
  },
  createElement: () => ({}),
};
globalThis.localStorage = {
  getItem: () => stored,
  setItem: (_, value) => {
    stored = value;
  },
};
globalThis.MutationObserver = class {
  constructor(fn) {
    onThemeChange = fn;
  }
  observe() {}
};
const api = await import(
  `data:text/javascript;base64,${Buffer.from(
    compiled.outputFiles[0].text
  ).toString("base64")}`
);
const {
  darkTheme: dark,
  contrastRatio: contrast,
  brandRamp,
  themeConfig,
  applyThemeConfig,
  currentRamp,
} = api;
assert.equal(
  themeConfig.brand,
  "#5e7ce0",
  "invalid saved settings must recover safely"
);
assert.equal(themeConfig.radius, "default");
assert.equal(themeConfig.motion, true);
api.useThemeConfig();
const lightSubtle = currentRamp.value.subtle;
document.documentElement.dataset.theme = "dark";
onThemeChange();
assert.notEqual(
  currentRamp.value.subtle,
  lightSubtle,
  "ramp preview must react to theme changes"
);
assert.equal(
  properties.get("--i-color-brand-subtle"),
  currentRamp.value.subtle
);
assert.equal(properties.get("--i-color-text-link"), currentRamp.value.brand);
let minimum = 21;
for (const ink of [
  "color-text",
  "color-text-secondary",
  "color-text-tertiary",
]) {
  for (const surface of [
    "color-bg",
    "color-bg-elevated",
    "color-bg-subtle",
    "color-bg-muted",
  ]) {
    const ratio = contrast(dark[ink], dark[surface]);
    minimum = Math.min(minimum, ratio);
    assert.ok(ratio >= 4.5, `${ink} on ${surface}: ${ratio}`);
  }
}
for (const ink of [
  dark["color-code-text"],
  dark["color-code-muted"],
  ...Object.values(api.syntaxDark),
]) {
  for (const surface of ["color-code-bg", "color-code-bar"])
    assert.ok(
      contrast(ink, dark[surface]) >= 4.5,
      `code ink ${ink} on ${surface}`
    );
}
for (const { value } of api.PRESET_BRANDS) {
  const ramp = brandRamp(value, "dark");
  for (const surface of ["color-bg", "color-bg-elevated", "color-bg-muted"])
    assert.ok(
      contrast(ramp.brand, dark[surface]) >= 4.5,
      `brand ${value} on ${surface}`
    );
  assert.equal(ramp.onBrandContrast, contrast(ramp.brand, ramp.onBrand));
}
assert.ok(
  contrast(dark["color-border-strong"], dark["color-bg"]) >= 3,
  "input boundary"
);
themeConfig.radius = "loose";
themeConfig.fontSize = "loose";
themeConfig.motion = false;
applyThemeConfig();
assert.equal(properties.get("--i-radius-md"), "8px");
assert.equal(properties.get("--i-font-size-md"), "16px");
assert.equal(document.documentElement.dataset.motion, "off");
assert.equal(properties.get("--i-motion-base"), "0ms");
assert.equal(JSON.parse(stored).motion, false);
api.resetThemeConfig();
applyThemeConfig();
assert.equal(document.documentElement.dataset.motion, "on");
assert.equal(
  properties.has("--i-motion-base"),
  false,
  "默认时长应当移除覆盖，回到编译出的令牌"
);

/* 精细化配置：每一类令牌都要能单独调，且调完真的写进 :root */
themeConfig.fontSize = "custom";
themeConfig.fontSizeCustom.md = 17;
themeConfig.radius = "custom";
themeConfig.radiusCustom.lg = 18;
themeConfig.density = "custom";
themeConfig.spacingScale = 150;
themeConfig.controlHeightCustom.md = 44;
themeConfig.shadow = "custom";
themeConfig.shadowIntensity = 0;
themeConfig.success = "#0f8a68";
themeConfig.neutralTint = 100;
themeConfig.lineHeight = "loose";
applyThemeConfig();
assert.equal(properties.get("--i-font-size-md"), "17px");
assert.equal(properties.get("--i-radius-lg"), "18px");
assert.equal(properties.get("--i-spacing-4"), "24px");
assert.equal(properties.get("--i-control-height-md"), "44px");
assert.equal(properties.get("--i-shadow-lg"), "none");
assert.equal(properties.get("--i-line-height-base"), "1.8");
assert.equal(
  properties.get("--i-color-success"),
  brandRamp("#0f8a68", "dark").brand
);
// 中性色只掺色相，不动明度——掺完的正文对比度不得低于原来的
const tinted = properties.get("--i-color-text");
assert.ok(tinted && tinted !== dark["color-text"], "中性色偏移应当生效");
assert.ok(
  contrast(tinted, properties.get("--i-color-bg")) >= 4.5,
  `中性色偏移后正文对比度 ${contrast(tinted, properties.get("--i-color-bg"))}`
);
// 导出的 CSS 必须是能直接用的声明，且不含空值
const css = api.themeCss.value;
assert.ok(css.includes("--i-font-size-md: 17px;"), "导出应包含自定义字号");
assert.ok(!/--i-[a-z-]+:\s*;/.test(css), "导出不得出现空值声明");
/* 液态玻璃：开着才有玻璃令牌，关掉必须干净地退回实心面 */
themeConfig.glass = true;
themeConfig.glassIntensity = 100;
applyThemeConfig();
assert.equal(document.documentElement.dataset.glass, "on");
const glassSurface = properties.get("--i-color-glass");
assert.ok(/^rgba\(/.test(glassSurface), "玻璃面应当是半透明的");
const alpha = Number(glassSurface.replace(/^rgba\(|\)$/g, "").split(",")[3]);
assert.ok(alpha >= 0.6, `玻璃最透也要留下边界，当前 ${alpha}`);
assert.ok(parseFloat(properties.get("--i-glass-blur")) >= 20, "强度拉满时模糊要跟上");
themeConfig.glass = false;
applyThemeConfig();
assert.equal(document.documentElement.dataset.glass, "off");
assert.equal(properties.has("--i-color-glass"), false, "关掉玻璃要移除覆盖");

/* 每一级的自定义值按各自区间夹取，越界的存档不该把版式带跑 */
const clamped = api.normalizeThemeConfig({
  fontSizeCustom: { md: 999, xs: 1 },
  radiusCustom: { sm: 99 },
  controlHeightCustom: { md: 5 },
});
assert.equal(clamped.fontSizeCustom.md, 24);
assert.equal(clamped.fontSizeCustom.xs, 10);
assert.equal(clamped.radiusCustom.sm, 8);
assert.equal(clamped.controlHeightCustom.md, 26);

api.resetThemeConfig();
applyThemeConfig();
localStorage.setItem = () => {
  throw new Error("blocked storage");
};
assert.doesNotThrow(() => applyThemeConfig());
console.log(
  `PASS: dark text/surface minimum ${minimum.toFixed(
    2
  )}:1; code palette, presets, reactive ramp, persistence, reset, scaling, motion, 精细化令牌、玻璃与导出。`
);
