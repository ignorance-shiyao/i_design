import assert from "node:assert/strict";
import { build } from "esbuild";

const compiled = await build({
  stdin: {
    contents: `export { darkTheme, syntaxDark } from './packages/common/src/tokens/index.ts'; export { contrastRatio, brandRamp } from './packages/common/src/logic/palette.ts'; export * from './src/composables/useThemeConfig.ts';`,
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
    style: { setProperty: (k, v) => properties.set(k, v) },
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
assert.equal(properties.get("--i-motion-base"), "");
localStorage.setItem = () => {
  throw new Error("blocked storage");
};
assert.doesNotThrow(() => applyThemeConfig());
console.log(
  `PASS: dark text/surface minimum ${minimum.toFixed(
    2
  )}:1; code palette, presets, reactive ramp, persistence, reset, scaling and motion.`
);
