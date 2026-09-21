# i_design — Ignorance Design

一套面向企业中后台产品的设计体系：**设计价值观 → 设计令牌 → 组件实现 → 文档站**。
同一套决策同时落到 Web、小程序、移动端与 Flutter：令牌、图标与交互规则只存在一份，
各端只写渲染适配，因此改一次颜色处处生效，也不必为某个端单独维护一套设计稿。

## 在线预览

推送到 `main` 或开发分支后，GitHub Actions 会自动构建并部署到 GitHub Pages：
`https://ignorance-shiyao.github.io/i_design/`

首次使用需在仓库 **Settings → Pages → Source** 选择 **Deploy from a branch → `gh-pages` / `(root)`**（一次性设置）。
工作流把产物推到 `gh-pages` 分支：`main` 发到站点根目录，其余分支发到 `preview/<分支名>/`，分支删除后自动清理。
工作流见 `.github/workflows/deploy.yml` 与 `.github/workflows/preview.yml`；站点使用 hash 路由，部署在子路径下也无需服务端改写。

## 快速开始

```bash
npm ci            # 用 ci 而不是 install：Vue 2.7 与 Vue 3 共存靠 .npmrc 的 legacy-peer-deps
npm run dev       # 启动文档站
npm run build     # 类型检查 + 生产构建
npm run preview   # 本地预览构建产物
```

合入门槛与开发约定见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 设计价值观

| 价值观 | 含义 |
| --- | --- |
| 沉浸 Immersive | 减少视觉噪音，强饱和色只用于需要用户行动的位置 |
| 灵活 Flexible | 令牌驱动，组件不写死具体色值，换肤与深色模式只改语义层 |
| 至简 Minimal | 默认值即最佳实践，只在两种选择都足够常见时才开放配置 |

可访问性不参与权衡：语义化标签、键盘可达、可见焦点样式与正确的 ARIA 状态是组件合入的前置条件。

## 令牌分层

1. **基础层** `packages/common/src/tokens/index.ts` — 调色板与原子刻度，只描述值。
2. **语义层** `packages/common/src/styles/tokens.css` — 把基础层映射到用途（`--i-color-brand`、`--i-color-text-secondary` …），亮/暗两套主题在此覆盖。
3. **组件层** — 组件样式只引用语义层变量，因此主题切换无需改动任何组件代码。

## 组件

组件按使用场景分为基础、导航、数据录入、数据展示、消息反馈五类。
完整清单、各端落地情况与每个组件当前的成熟度，看站内「组件全景」与「覆盖矩阵」——
那两处是从源码目录生成的，这里不再抄一份：手抄的清单会漂移，而漂移不会让构建失败。

交互组件均可键盘操作，深色主题开箱可用。`message()` / `notification()` / `confirm()`
是命令式 API，挂在 body 上，不在组件树里。

## 安装与使用

各端的包在 `packages/` 下，`@i-design/common` 提供令牌、图标与纯逻辑，
其余包只做渲染适配：

| 你的技术栈 | 包 |
| --- | --- |
| Vue 3 | `@i-design/vue-next` |
| Vue 2.7 | `@i-design/vue` |
| React | `@i-design/react` |
| 移动端（Vue 3 / React） | `@i-design/mobile-vue`、`@i-design/mobile-react` |
| 小程序 | `packages/miniprogram`（自定义组件，按目录引用） |
| Flutter | `packages/flutter`（pub 包） |

**这些包还没有发布到 npm registry**，现阶段按本地 tarball 消费：

```bash
npm run build:packages                       # 编译各包的产物
cd packages/vue-next && npm pack              # 得到 i-design-vue-next-0.1.0.tgz
npm i /path/to/i-design-vue-next-0.1.0.tgz   # 在你的项目里装它
```

装好之后的用法（以 Vue 3 为例，其余端同构）：

```ts
import { createApp } from 'vue'
import { IButton } from '@i-design/vue-next'
import '@i-design/common/styles/index.css'   // 样式与令牌，必须引
```

`npm run check:install` 就是把上面这串在仓库外的干净项目里真跑一遍：
四个消费项目各自过类型、打包、渲染与样式四关。

## 目录结构

```
packages/
├─ common/        令牌、图标、纯逻辑、共享样式——只存在这一份
├─ vue-next/      Vue 3 渲染适配
├─ vue/           Vue 2.7 渲染适配（由 vue-next 转换生成）
├─ react/         React 渲染适配
├─ mobile-vue/    移动端专有组件（Vue 3）
├─ mobile-react/  移动端专有组件（React）
├─ miniprogram/   小程序四件套（按目录生成）
└─ flutter/       Flutter 实现，令牌由 common 编译成 Dart 常量
src/              文档站：组件示例、组件源码（vue-next 包由它生成）、路由与数据
scripts/          生成与检查脚本；哪些文件是生成的，看 package.json 的 build:* 各自写到哪儿
```

新增组件要各端齐备，并在文档站里有可运行的演示——`npm run check:parity`
与 `npm run check:registry` 会把漏掉的那一端和没有演示的组件报出来。
具体流程见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 插画

吉祥物「小白」与「十五」的插画用于空状态、错误页与首页 Hero，见站内 **设计资源** 页。

素材为带渐变与毛发笔触的绘画稿（单张 7–15 万独立颜色），不适合矢量化，因此按显示尺寸
导出 1x / 2x 的 WebP 并用 `srcset` 交给浏览器选择：整套从 8.8 MB 压到约 750 KB。
需要跟随主题变色的小图形走图标系统（内联 SVG + `currentColor`）——图标表意，插画表情绪。

## 许可证与素材来源

MIT，全文见 [LICENSE](LICENSE)，各发布包内也带同一份。
随产物分发的第三方包、图标与位图素材的来源记录见 [THIRD-PARTY.md](THIRD-PARTY.md)。
