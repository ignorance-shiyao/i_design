# i_design — Ignorance Design

一套面向企业中后台产品的设计体系：**设计价值观 → 设计令牌 → Vue 3 组件库 → 文档站**。
参考 [DevUI](https://devui.design/) 的组织方式，把设计决策沉淀成可被代码直接消费的系统。

## 快速开始

```bash
npm install
npm run dev       # 启动文档站
npm run build     # 类型检查 + 生产构建
npm run preview   # 预览构建产物
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

Button、Input、Select、Switch、Tag、Card、Table、Alert、Modal —— 统一 `sm / md / lg` 尺寸约定，深色主题开箱可用。

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

## License

MIT
