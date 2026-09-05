# 架构与取舍

## 分层

```
packages/tokens   设计令牌唯一源头（TypeScript）
                  build 时生成 dist/tokens.css：
                    :root                     → 亮色 + 默认密度
                    [data-i-theme="dark"]     → 深色覆盖
                    @media (prefers-color-scheme: dark) [data-i-theme="auto"]
                    [data-i-density="..."]    → 密度覆盖

packages/core     · classnames.ts  统一 BEM 类名工厂（两个框架必须输出同样的类名）
                  · behaviors/*    无头行为：算状态、算 ARIA、算类名，不碰任何框架 API
                  · dom/position   定位引擎（翻转 + 边界收敛）
                  · dom/focus      焦点锁 + 引用计数的滚动锁
                  · theme / i18n   主题与语言的纯函数
                  · message.ts     命令式提示，纯 DOM
                  · styles/*.css   唯一一份样式表

packages/react    每个组件 = 调用 core 行为 + 把 ElementSpec 翻成 React props
packages/vue      每个组件 = 调用 core 行为 + 把 ElementSpec 翻成 h() 参数
```

## 关键抽象：`ElementSpec`

行为层不返回 JSX，也不返回 VNode，而是返回一个纯数据描述：

```ts
interface ElementSpec {
  class: string;                                  // 已经算好的完整类名
  attrs: Record<string, string | number | boolean | undefined>;   // 含全部 ARIA
  on: Partial<Record<EventName, (event: any) => void>>;           // 中性事件名
}
```

React 的 `toProps()` 把 `class → className`、`click → onClick`；
Vue 的 `toProps()` 把 `click → onClick`（属性名 Vue 原样接受）。
两个适配器加起来不到 40 行，**组件逻辑一行都不在里面**。

这带来一个可执行的保证：同样的 props 必然产出同样的 DOM。`tests/parity.test.tsx`
就是把这个保证钉死的地方。

### 两个框架真正无法一致的地方

只有一处：`checked` 是 DOM **属性（property）**，React 会额外把它反射成 HTML attribute，Vue 不会。
测试里对这一项做了归一化，同时单独断言两边 `input.checked` 都为 `true`——差异被显式记录，而不是被藏起来。

## 为什么不用 Web Components

Web Components 看似是跨框架的标准答案，实际代价是：SSR 需要额外方案、表单参与需要 ElementInternals、
样式穿透需要 part/theme、React 17 以下事件与属性传递有坑、类型体验差。
i-design 渲染的是原生 `<button>` / `<input>`，上述问题全部不存在，代价只是多写两个薄适配器。

## 受控 / 非受控

两个框架都遵循各自生态的习惯，但语义一致：

* React：传 `value` 即受控，传 `defaultValue` 即非受控（`useControlled`）。
* Vue：绑 `v-model` 即受控，传 `defaultValue` 即非受控（同名的 `useControlled`）。

## portal 与主题

Dialog / Tooltip / message 都会离开 Provider 的 DOM 子树。它们在传送目标上重新写入
`data-i-theme` / `data-i-density` / `dir`，否则深色应用会弹出亮色弹窗——这是很多组件库长期存在的缺陷。

## 样式约定

* 只消费语义令牌（`--i-color-*`），不直接用色板原始值，这样换肤才安全。
* 一律使用逻辑属性（`padding-inline`、`inset-inline-start`），RTL 免费获得。
* 尊重 `prefers-reduced-motion`。
* 焦点样式只用 `:focus-visible`，键盘用户可见、鼠标用户不打扰。
