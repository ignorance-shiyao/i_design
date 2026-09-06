# i-design

一套 **同时支持 React 与 Vue** 的公共组件库。设计令牌、样式、交互行为、无障碍逻辑全部只写一份，
React 与 Vue 只是两层薄薄的“绑定层”。

```
┌──────────────────────────────────────────────────────────┐
│  @i-design/tokens   设计令牌（TS 源 → CSS 变量）          │
│         ↓                                                │
│  @i-design/core     无头行为 + 类名 + 无障碍 + 样式表     │
│         ↓                        ↓                       │
│  @i-design/react            @i-design/vue                │
│  （~15 行绑定层）           （~15 行绑定层）              │
└──────────────────────────────────────────────────────────┘
```

## 为什么这样分层

市面上的做法各有取舍，i-design 取其长：

| 方案 | 代表 | 问题 | i-design 的选择 |
| --- | --- | --- | --- |
| 每个框架各写一套 | TDesign、Element Plus | 两套实现逐渐跑偏，同一个 bug 修两次 | 行为只写一次，放在 `core` |
| Web Components 包一层 | 部分企业库 | SSR、表单、样式穿透、类型体验都要额外还债 | 不用自定义元素，直接渲染原生标签 |
| 只做 headless | Radix / Headless UI | 没有默认视觉，团队仍要自己搭一套设计体系 | headless 之上再给一套完整的令牌与样式 |

结果是：**同样的 props → 同样的 DOM**。这不是口号，是被测试强制保证的（见下）。

## 相比现有组件库新增的特性

1. **跨框架 DOM 一致性测试**：`tests/parity.test.tsx` 用同一组 props 分别渲染 React 与 Vue 组件，
   逐字节比较归一化后的 HTML，覆盖全部 30 个组件（仅 Button 就有 4 变体 × 5 状态 × 3 尺寸共 60 种组合）。
   只在一个框架里改了行为，CI 会直接红。
2. **密度（density）是一等公民**：`compact / default / loose` 一次性改变**所有**控件的高度与内边距，
   不是每个组件各自的 `size`。控制台和营销页可以共用同一套库。
3. **运行时换肤，且可嵌套**：`<ConfigProvider tokens={{ 'color-brand': '#7c3aed' }}>` 直接下发 CSS 变量，
   无需重新构建、无需 Less/Sass 变量覆盖。嵌套的 Provider 只覆盖它显式设置的那几项。
4. **portal 内容自动继承主题**：Dialog / Tooltip / Message 传送到 `body` 之后会重新贴上主题属性，
   深色应用里不会弹出一个亮色弹窗——这是很多库长期存在的问题。
5. **逻辑属性写样式**：全部使用 `padding-inline` / `inset-inline-start`，
   切到阿拉伯语 locale 时自动 RTL，不需要额外的 RTL 样式包。
6. **命令式 API 与框架无关**：`message.success()` 就是一个普通函数，React、Vue、甚至原生脚本里都能用。
7. **无障碍是默认行为**：焦点环统一、Dialog 有焦点锁 + Esc + `aria-modal`，
   FormItem 自动把 `label / 控件 / 错误信息` 用 `for` 和 `aria-describedby` 串起来。
8. **零运行时依赖**：`cx`、定位引擎、焦点锁、roving tabindex 都是自带的几十行实现，不引入 clsx / floating-ui。
9. **一份键盘导航引擎**：RadioGroup、Tabs、Select 共用 core 的 `useRoving`，
   不会出现「Tabs 支持方向键、Radio 不支持」这种常见的不一致。
10. **表单校验引擎与框架解耦**：规则是纯数据（可以来自配置或服务端），
    `FormStore` 是一个可订阅的小 store，两个框架各自只接一根线，校验语义完全一致。

## 快速开始

```bash
pnpm install
pnpm build          # 构建 4 个包
pnpm test           # 76 个测试：核心逻辑 / 行为与键盘 / 表格与校验 / 跨框架一致性 / 交互与无障碍
pnpm --filter @i-design/playground dev   # 打开 React 与 Vue 并排的演示页
```

### React

```tsx
import { Button, ConfigProvider, Input, message } from '@i-design/react';
import '@i-design/core/styles';

<ConfigProvider mode="dark" density="compact" locale="zh-CN">
  <Input clearable showCount maxlength={40} onChange={setValue} />
  <Button status="brand" onClick={() => message.success('已保存')}>保存</Button>
</ConfigProvider>
```

### Vue

```ts
import IDesign, { message } from '@i-design/vue';
import '@i-design/core/styles';

app.use(IDesign);
```

```vue
<IConfigProvider mode="dark" density="compact" locale="zh-CN">
  <IInput v-model="value" clearable show-count :maxlength="40" />
  <IButton status="brand" @click="message.success('已保存')">保存</IButton>
</IConfigProvider>
```

## 在线预览

https://claude.ai/code/artifact/1b6e11f5-e3eb-44e3-9db3-b8d558666354

左右两栏分别由 React 和 Vue 渲染，可实时切换主题 / 密度 / 语言 / 品牌色。
重新生成预览页：`pnpm preview:build`（把 playground 打包成单个自包含 HTML）。

## 当前组件（32 个，React / Vue 双端一致）

**基础**：ConfigProvider（主题/密度/方向/语言，可嵌套）、Button（4 变体 × 5 状态 × 3 尺寸 × 4 形状）、
Divider、Space、Row / Col（24 栅格 + 响应式断点）

**表单**：Input、Textarea（自动增高）、Checkbox、Switch、RadioGroup（含分段按钮样式）、
Select（WAI-ARIA combobox：方向键、Home/End、首字母跳转、`aria-activedescendant`）、
FormItem、**Form + FormField**（校验引擎在 core，支持同步/异步规则、trigger、脏值追踪）

**数据展示**：**Table**（排序 / 多选 / 固定列 / 粘性表头 / 加载与空状态）、Card、Tag、
Avatar（含 CJK 首字缩写）、Badge、Progress（线形/环形）、Skeleton、Spinner、Empty

**导航**：Tabs（line / card / segment 三种，方向键切换）、Collapse（支持手风琴）、
Pagination（省略号算法）、Steps、Breadcrumb

**反馈**：Alert、Dialog、Drawer（四个方向，RTL 自动镜像）、Tooltip / Popover、message（命令式）

| 能力 | 说明 |
| --- | --- |
| 键盘导航 | RadioGroup / Tabs / Select 共用 core 里同一个 roving tabindex 引擎，一组控件只占一个 Tab 停靠点 |
| 无障碍 | 每个组件的 role 与 aria 由 core 计算，两端完全一致；Dialog/Drawer 带焦点锁与 Esc |
| 受控/非受控 | React 用 `value` / `defaultValue`，Vue 用 `v-model` / `defaultValue`，语义一致 |
| 表单校验 | 规则是可序列化的数据；`FormStore` 是框架无关的可订阅 store，React 用 `useSyncExternalStore`、Vue 用 `shallowRef` 各接一次 |

更多设计取舍见 [docs/architecture.md](docs/architecture.md)，后续规划见 [docs/roadmap.md](docs/roadmap.md)，
新增组件的步骤见 [docs/adding-a-component.md](docs/adding-a-component.md)。
