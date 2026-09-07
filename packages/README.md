# 跨端架构

目标是「同一套设计体系，在 7 个技术栈上长得一样、行为一致」。做法不是把 38 个组件抄 7 遍，
而是把**与框架无关的部分**抽出来共享，各端只写渲染适配：

```
packages/
├─ common/          与框架无关的公共层（唯一数据源）
│  ├─ src/tokens/     设计令牌：颜色、字号、间距、圆角、阴影、动效
│  ├─ src/icons/      图标路径数据（纯 path，不含任何框架代码）
│  ├─ src/logic/      交互规则：日期、校验、上传、选择、分页、排序、头像取色
│  ├─ src/styles/     BEM 样式，Web 各端共享同一份 CSS
│  └─ scripts/        令牌编译器 → CSS / SCSS / JSON / WXSS / Dart
├─ react/           React 实现
└─ （规划）vue / vue-next / miniprogram / mobile-vue / mobile-react / flutter
```

## 为什么这样分

- **令牌**是唯一数据源。改一次颜色，Web、小程序、Flutter 同时生效——不存在「安卓端的蓝色
  跟设计稿差一点」。编译产物见 `common/dist/tokens/`。
- **逻辑**是纯函数，不依赖任何框架的响应式系统。Vue 用 `ref` 包一层、React 用 `useState`
  包一层、小程序用 `setData`，但「方向键跳过禁用项」这条规则只写一次。
- **样式**用 BEM 类名而非框架的作用域机制，因此 Vue 的 `.i-button--primary` 和 React 的
  `.i-button--primary` 是同一段 CSS，不可能长歪。

## 各端的差异在哪

| 层 | Web（vue / react / mobile-*） | 小程序 | Flutter |
| --- | --- | --- | --- |
| 令牌 | `tokens.css` | `tokens.wxss` | `tokens.dart` |
| 样式 | 共享 CSS | WXSS（不支持 `:root`，作用在 `page`） | Dart 常量 + ThemeData |
| 逻辑 | 直接 import | 直接 import | 需按同一规则移植 |
| 渲染 | 各框架自写 | WXML | Widget |

Flutter 是唯一无法共享 CSS 与 TS 逻辑的一端，因此令牌编译器为它生成 Dart 常量与
`ThemeData`，保证颜色与尺寸逐值一致；逻辑层按同一套规则移植。
