# 架构与取舍

## 令牌的两层结构

```
packages/tokens/src/palette.ts    基元：RGB 三元组
                                  --i-brand-5: 65, 105, 239;
packages/tokens/src/semantic.ts   语义：rgba(var(--i-brand-5), .08)
```

为什么不直接存十六进制？因为三元组可以和 alpha 组合。`--i-color-text-secondary`
是 `rgba(var(--i-grey-9), .66)`，`--i-color-border` 是同一个灰的 `.11`，
`--i-color-bg-hover` 是 `.05`——它们天然属于同一色系，不会各自漂移。
深色模式只需要换三元组和几个 alpha，而不是重新挑几十个颜色。
运行时换品牌色也因此变成设置三个变量的事。

代价是：`resolveTokens()` 返回的是 `rgba(var(...))` 引用而不是真实颜色。
需要真实值时（比如喂给 canvas 或图表库）用 `readComputedTokens()`，它从 DOM 读计算值。

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

只有两处，且都是 DOM **属性（property）** 与 HTML attribute 的差别：

* `checked`（Checkbox / Switch）：React 会额外反射成 attribute，Vue 不会。
* `value`（Textarea）：React 写成 attribute，Vue 设置属性、序列化时表现为元素文本。

测试里对这两项做归一化，同时**单独断言**两边真实 DOM 的 `.checked` / `.value`——差异被显式记录，而不是被藏起来。

还有一个陷阱值得单独说：**style 不能放进 `ElementSpec.attrs`**。
Vue 接受 `style="..."` 字符串，React 直接抛错。所以行为层一律把样式作为独立对象返回
（见 `useRow` / `useCol` / `useTable().cellStyle`），并且 `spec()` 在发现原始 style 字符串时会直接抛错，
把这个错误挡在写代码的那一刻，而不是留到某个框架的运行时。

## 动效

动效不是"框架特性"，而是 **core 里的一个相位状态机 + 类名**：

```
exited → enter →（一帧后）entered → exit →（duration 后）exited
```

`createTransitionController` 负责相位与计时，适配器只负责挂载/卸载。
所以 React 的 `<Transition>` 和 Vue 的 `<ITransition>` 时序完全一致，两边都不需要各写一份 tween。
折叠动画用 `grid-template-rows: 0fr → 1fr`，不需要 JS 去测 `scrollHeight`。

## AI 会话

这类界面里最容易做错、且每个应用都要重写一遍的三件事，都在 core 里解决：

1. **输入法安全的 Enter 发送**：候选词阶段按 Enter 只是确认候选，不能发送。
   `usePromptInput` 同时检查 `isComposing`、`keyCode === 229` 和 `nativeEvent.isComposing`。
2. **流式显示与网络分片解耦**：token 是成批到达的，直接渲染会一块块跳。
   `createStreamController` 把分片放进缓冲区，按固定速率吐出，`flush()` 可以立即显示全部。
3. **滚动跟随**：`isAtBottom` 决定是否继续贴底——用户往上翻历史时不该被强制拉回。

## 表单校验

规则是**纯数据**（`{ required, min, max, pattern, validator, trigger, message }`），因此可以来自配置文件或服务端。
`FormStore` 是一个不依赖任何框架的可订阅 store：React 用 `useSyncExternalStore` 接、Vue 用 `shallowRef` 接，
校验顺序、空值语义（除 `required` 外的规则对空值一律跳过）、异步规则、脏值追踪都只有一份实现。

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
