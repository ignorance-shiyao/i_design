# i_design — Ignorance Design

一套面向企业中后台产品的设计体系：**设计价值观 → 设计令牌 → Vue 3 组件库 → 文档站**。
参考 [DevUI](https://devui.design/) 的组织方式，把设计决策沉淀成可被代码直接消费的系统。

## 在线预览

推送到 `main` 或开发分支后，GitHub Actions 会自动构建并部署到 GitHub Pages：
`https://ignorance-shiyao.github.io/i_design/`

首次使用需在仓库 **Settings → Pages → Source** 选择 **GitHub Actions**（一次性设置）。
工作流见 `.github/workflows/deploy.yml`；站点使用 hash 路由，部署在子路径下也无需服务端改写。

## 快速开始

```bash
npm install
npm run dev       # 启动文档站
npm run build     # 类型检查 + 生产构建
npm run preview   # 本地预览构建产物
```

## 设计价值观

| 价值观 | 含义 |
| --- | --- |
| 沉浸 Immersive | 减少视觉噪音，强饱和色只用于需要用户行动的位置 |
| 灵活 Flexible | 令牌驱动，组件不写死具体色值，换肤与深色模式只改语义层 |
| 至简 Minimal | 默认值即最佳实践，只在两种选择都足够常见时才开放配置 |

可访问性不参与权衡：语义化标签、键盘可达、可见焦点样式与正确的 ARIA 状态是组件合入的前置条件。

## 令牌分层

1. **基础层** `src/tokens/index.ts` — 调色板与原子刻度，只描述值。
2. **语义层** `src/styles/tokens.css` — 把基础层映射到用途（`--i-color-brand`、`--i-color-text-secondary` …），亮/暗两套主题在此覆盖。
3. **组件层** — 组件样式只引用语义层变量，因此主题切换无需改动任何组件代码。

## 组件

按使用场景分五类，已实现 33 个（另有 5 个在规划中，见站内「组件总览」）：

| 分类 | 组件 |
| --- | --- |
| 基础 | Button、Icon、Tag、Divider |
| 导航 | Tabs、Pagination、Breadcrumb、Steps |
| 数据录入 | Form、Input、Textarea、Select、DatePicker、Radio、Checkbox、Switch、Upload |
| 数据展示 | Table、Card、Tooltip、Empty、Avatar、Badge、Collapse、Descriptions、Skeleton |
| 消息反馈 | Alert、Message、Modal、Drawer、Loading、Popconfirm、Result |

统一尺寸约定，深色主题开箱可用，交互组件均可键盘操作。Message 为命令式 API（`message.success('…')`）。

```ts
import IDesign from '@/components'
import '@/styles/global.css'

app.use(IDesign)          // 全量注册
// 或按需引入：import IButton from '@/components/IButton.vue'
```

## 目录结构

```
src/
├─ tokens/       设计令牌（TS 常量，供文档站与工具消费）
├─ styles/       令牌的 CSS 变量声明与全局样式
├─ components/   组件库
├─ site/         文档站骨架（页头、页脚、侧栏、示例容器）
├─ pages/        文档页面
└─ data/nav.ts   文档导航配置
```

新增组件时：实现 `src/components/IXxx.vue` → 在 `src/components/index.ts` 注册 → 增加 `src/pages/components/XxxPage.vue` 文档页 → 在 `src/router/index.ts` 与 `src/data/nav.ts` 中登记。

## 插画

吉祥物「小白」与「十五」的插画用于空状态、错误页与首页 Hero，见站内 **设计资源** 页。

素材为带渐变与毛发笔触的绘画稿（单张 7–15 万独立颜色），不适合矢量化，因此按显示尺寸
导出 1x / 2x 的 WebP 并用 `srcset` 交给浏览器选择：整套从 8.8 MB 压到约 750 KB。
需要跟随主题变色的小图形走图标系统（内联 SVG + `currentColor`）——图标表意，插画表情绪。

## License

MIT
