# 变更记录

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本策略见 [VERSIONING.md](VERSIONING.md)。

各端的包共用同一个版本号，一起发布。

## [未发布]

### 新增

- 能力注册表：各端源码路径、是否从入口导出、成熟度、状态集、文档入口与演示数，
  全部按目录生成（`npm run check:registry`）。
- 外部安装烟测：包 pack 出来装进仓库外的干净项目，过类型、打包、渲染与样式
  （`npm run check:install`）。
- SSR / hydrate / CSP 检查（`npm run check:ssr`）。
- 样式禁令检查：加粗状态边线、渐变填充、写死的白字、图标里的 emoji
  （`npm run check:style-rules`）。
- 许可证随包分发，素材来源逐个登记（`LICENSE`、`THIRD-PARTY.md`）。
- 运行事件契约与 reducer：乱序、重发、迟到、取消后续写都有明确处理。

### 修复

- 插画不再随主入口分发：移到 `@i-design/common/illustrations` 子路径，
  并在各端构建里外置。此前 Vite 的 library 模式把十八张绘画稿内联成 data URI，
  内联之后摇树也摇不掉——只引一个按钮的使用方要背走整套图。
  实测：只引一个按钮从 815 kB gzip 降到 9.0 kB。
  **如果你在用 `emptyIllustrations` / `errorIllustrations` / `heroIllustrations` /
  `mascotIllustration`，把 import 改成 `@i-design/common/illustrations`。**

- `notification` 的列表从模块顶层的 `reactive([])` 改为 `ref`：
  Vue 2.7 不接受数组作为 reactive 的根，导致 watch / watchEffect 跟踪不到。
- 图标的默认尺寸从内联 style 属性挪进 `.i-icon` 类：
  不带 `unsafe-inline` 的 CSP 会拒掉整个 style 属性，图标会塌成 0。

### 弃用

- （无）

## [0.1.0] - 2026-09-01

首个内部版本：各端组件、令牌与文档站。
