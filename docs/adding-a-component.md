# 新增一个组件

以 Radio 为例，按这四步走，两个框架自然保持一致。

## 1. 行为放进 core

`packages/core/src/behaviors/radio.ts`：算出类名、ARIA、事件处理，返回 `ElementSpec`。
**不要 import react / vue**，这一层不允许出现任何框架 API。

## 2. 样式放进 core

`packages/core/src/styles/radio.css`，只使用语义令牌与逻辑属性，然后在 `styles/index.css` 里 `@import`。

## 3. 两个适配器

`packages/react/src/components/Radio.tsx` 与 `packages/vue/src/components/Radio.ts`：
只做三件事——读 props、调用行为、用 `toProps()` 渲染。适配器里出现 `if` 判断视觉或状态，
基本就说明这段逻辑应该下沉到 core。

## 4. 加一致性测试

在 `tests/parity.test.tsx` 里补一条：同一组 props 渲染两边，断言归一化 HTML 相等。
覆盖所有会影响类名的枚举组合。

```bash
pnpm test && pnpm build
```
