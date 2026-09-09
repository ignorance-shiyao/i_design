# @i-design/miniprogram

小程序实现（29 个组件）。与 Web 端共享的部分：

- **令牌**：`tokens.wxss`，挂在 `page` 上（小程序不支持 `:root`）。主题切换给 `page` 加 `theme-dark`。
- **样式**：`build-styles.mjs` 把共享 CSS 编译为 WXSS，逐条降级不支持的语法（通配选择器、
  `:focus-visible`、`backdrop-filter`、`color-mix`），而不是另写一套。
- **逻辑**：`buildPages`、`sortRows`、`resolveDuration`、`initialsOf`/`tintOf` 等直接从
  `@i-design/common` 引入，因此分页序列、排序规则、头像配色与 Web 端逐字一致。

## 与 Web 端的三处必要差异

| 差异 | 原因与做法 |
| --- | --- |
| 图标 | WXML 不渲染内联 SVG。用 CSS mask：形状来自遮罩、颜色来自 `currentColor`，因此图标仍跟随文字色，无需为深色模式准备第二套 |
| 插槽探测 | 小程序无法判断具名插槽是否有内容，`hasFooter` / `hasAction` 这类由使用方显式声明 |
| 组与项 | Web 端靠 provide/inject 让子项拿到组状态，小程序没有等价机制，Radio / Checkbox 改为 `options` 数组，也省去跨组件 setData 开销 |

## 校验

`npm run check:mp` 做静态校验：四件套齐全、JS 可解析、`styleIsolation` 为 `apply-shared`
（漏设会让共享类名被样式隔离挡掉）、WXML 里引用的图标均已定义。

本仓库没有小程序运行时，无法做浏览器级实测，上述静态校验是当前能提供的最强保证；
接入小程序 CI 后应补真机截图比对。

## 接入

```js
// app.wxss
@import '/node_modules/@i-design/common/dist/tokens/tokens.wxss';

// page.json
{ "usingComponents": { "i-button": "/node_modules/@i-design/miniprogram/src/components/button/index" } }
```
