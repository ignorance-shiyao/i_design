# 后续规划

当前版本（0.1.0）已经把地基和验证机制做完：令牌体系、无头核心、两个适配器、
跨框架一致性测试、并排演示。下面是按价值排序的推进顺序。

## 近期：补齐表单与数据展示

| 组件 | 关键点 |
| --- | --- |
| Select / Cascader | 复用 `computePosition`；键盘导航（↑↓ Home End 输入过滤）放进 core 的 listbox 行为 |
| Radio / RadioGroup | 复用 toggle 行为，加 roving tabindex |
| DatePicker | 日期计算放 core，两个适配器只渲染 |
| Table | 虚拟滚动、固定列、排序；状态机放 core |
| Pagination / Tabs / Menu | 都属于“选中态 + 键盘导航”这一类，共用一个 core 行为 |
| Form | 校验引擎放 core，React 用 hook、Vue 用 composable 各包一层 |

## 工程化

* **视觉回归**：把 playground 的截图接进 CI（Playwright），令牌一改就能看到差异。
* **SSR 测试**：React `renderToString` 与 Vue `renderToString` 的输出也纳入一致性比较。
* **按需引入**：目前样式是一整份 `styles/index.css`；下一步给每个组件独立 CSS 入口 + unplugin 自动引入。
* **包体预算**：core 目前零依赖，加一个 size-limit 阈值防止回退。

## 面向使用者的能力

* **主题编辑器**：基于 `computedTokens()` 做一个可视化调色页面，导出一份 token 覆盖 JSON。
* **对比度校验**：构建时校验文字/背景令牌组合满足 WCAG AA，深色模式尤其容易踩坑。
* **Figma 令牌同步**：`packages/tokens` 已经是纯数据，接 Figma Variables 只是加一个导出脚本。
* **更多框架**：Svelte / Solid 适配器各自也只需要一个 `toProps()`，核心不用动。
