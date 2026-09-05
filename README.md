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
   逐字节比较归一化后的 HTML（Button 覆盖 4 变体 × 5 状态 × 3 尺寸共 60 种组合）。
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
8. **零运行时依赖**：`cx`、定位引擎、焦点锁都是自带的几十行实现，不引入 clsx / floating-ui。

## 快速开始

```bash
pnpm install
pnpm build          # 构建 4 个包
pnpm test           # 29 个测试：核心逻辑 / 跨框架一致性 / 交互与无障碍
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

## 当前组件

| 组件 | React | Vue | 说明 |
| --- | --- | --- | --- |
| ConfigProvider | ✅ | ✅ | 主题 / 密度 / 方向 / 语言，可嵌套 |
| Button | ✅ | ✅ | 4 变体 × 5 状态 × 3 尺寸 × 4 形状，loading 期间吞掉点击 |
| Input | ✅ | ✅ | 受控/非受控、清除、字数统计、状态色 |
| Checkbox / Switch | ✅ | ✅ | 共用一份 toggle 行为，支持 indeterminate |
| Tag | ✅ | ✅ | 可关闭 |
| Space | ✅ | ✅ | 间距布局 |
| FormItem | ✅ | ✅ | 自动串联 label / 控件 / 错误信息 |
| Dialog | ✅ | ✅ | 焦点锁、滚动锁、Esc、遮罩点击 |
| Tooltip / Popover | ✅ | ✅ | 自带定位引擎，自动翻转与边界收敛 |
| message | ✅ | ✅ | 命令式，框架无关 |

更多设计取舍见 [docs/architecture.md](docs/architecture.md)，后续规划见 [docs/roadmap.md](docs/roadmap.md)，
新增组件的步骤见 [docs/adding-a-component.md](docs/adding-a-component.md)。
