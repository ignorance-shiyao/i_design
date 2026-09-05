# 后续规划

当前版本已经覆盖 30 个组件：令牌体系、无头核心、两个适配器、跨框架一致性测试、
键盘导航引擎、并排演示都已就位。下面是按价值排序的推进顺序。

## 已完成（0.2.0）

基础（ConfigProvider / Button / Divider / Space / Row / Col）、
表单（Input / Textarea / Checkbox / Switch / RadioGroup / Select / FormItem）、
数据展示（Card / Tag / Avatar / Badge / Progress / Skeleton / Spinner / Empty）、
导航（Tabs / Collapse / Pagination / Steps / Breadcrumb）、
反馈（Alert / Dialog / Drawer / Tooltip / message）。

## 下一批组件

| 组件 | 关键点 |
| --- | --- |
| Table | 排序、固定列、虚拟滚动；列模型与选择状态机放 core |
| Form | 校验引擎放 core，React 用 hook、Vue 用 composable 各包一层 |
| Menu / Dropdown | 复用 `useRoving` + `computePosition`，加子菜单的 typeahead |
| DatePicker | 日期计算与键盘网格导航放 core，两个适配器只负责渲染 |
| Cascader / TreeSelect / Tree | 复用 Select 的 listbox 行为，加层级展开状态 |
| Upload | 文件列表状态机放 core，拖拽与预览在适配器 |
| Popconfirm / Notification | Tooltip 与 message 之上的组合层 |
| Slider / InputNumber | 数值步进与键盘增减放 core |

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
