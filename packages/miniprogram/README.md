# @i-design/miniprogram

小程序实现。与 Web 端共享的部分：

- **令牌**：`@i-design/common` 编译出的 `tokens.wxss`，挂在 `page` 上（小程序不支持 `:root`）。
  在 `app.wxss` 里 `@import` 一次即可，主题切换给 `page` 加 `theme-dark` 类。
- **样式**：`scripts/build-styles.mjs` 把 Web 端共享 CSS 编译为 WXSS，逐条降级不支持的语法
  （通配选择器、`:focus-visible`、`backdrop-filter`、`color-mix`），而不是另写一套。
- **逻辑**：直接 `import { initialsOf, tintOf } from '@i-design/common'`，
  因此「林岚」这个名字在小程序里得到的缩写与底色，与 Web 端一字不差。

各组件的 `styleIsolation` 设为 `apply-shared`、`addGlobalClass: true`，
否则小程序默认的样式隔离会挡掉共享类名。

## 接入

```js
// app.wxss
@import '/node_modules/@i-design/common/dist/tokens/tokens.wxss';

// page.json
{ "usingComponents": { "i-button": "/node_modules/@i-design/miniprogram/src/components/button/index" } }
```

```html
<i-button variant="primary" bind:click="onSubmit">提交</i-button>
```
