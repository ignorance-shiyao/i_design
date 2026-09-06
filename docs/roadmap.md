# 后续规划

当前版本已经覆盖 30 个组件：令牌体系、无头核心、两个适配器、跨框架一致性测试、
键盘导航引擎、并排演示都已就位。下面是按价值排序的推进顺序。

## 已完成（0.7.0）

基础（ConfigProvider / Button / Divider / Space / Row / Col）、
表单（Input / Textarea / Checkbox / Switch / RadioGroup / Select / FormItem）、
数据展示（Card / Tag / Avatar / Badge / Progress / Skeleton / Spinner / Empty）、
导航（Tabs / Collapse / Pagination / Steps / Breadcrumb）、
反馈（Alert / Dialog / Drawer / Tooltip / message）、
数据（Table：排序 / 多选 / 固定列 / 粘性表头）、Form + FormField（校验引擎在 core）、
动效（Transition / Stagger / Carousel）、AI 会话（Chat / ChatMessage / PromptInput /
TypingIndicator / ThinkingBlock / CodeBlock / Suggestions + 流式与滚动跟随）。
数值录入（InputNumber / Slider / Rate / Upload）、结构（Layout / Menu / Tree / Anchor / BackTop）、
数据展示（List / Descriptions / Statistic / Timeline / Segmented / Typography）、
反馈（Notification / Result / Watermark）。共 52 个组件。
文档站：顶部导航 + 可筛选侧边栏 + 本页目录，每个组件含「何时使用 / 代码演示（可展开双端代码，带语法高亮）/ API」，
另有设计令牌页、各家所长页、控制台示例页与实时外观设置面板；移动端为侧栏抽屉 + 单列布局。
图标集：36 个自绘 24×24 描边图标，两端渲染同一份 SVG。

## 下一批组件

| 组件 | 关键点 |
| --- | --- |
| Table 进阶 | 虚拟滚动、可展开行、列宽拖拽；分页与 Pagination 组合 |
| Form 进阶 | 动态字段数组（FieldArray）、跨字段联动校验、i18n 校验文案 |
| Dropdown | 把 Menu 的 popup 模式接到 `computePosition` 上，补子菜单 typeahead |
| TimePicker / RangePicker | 复用 DatePicker 的网格与键盘模型 |
| Cascader / TreeSelect | 复用 Tree 与 Select 的模型 |
| Transfer | 双列表选择，复用 Tree 的勾选联动 |
| 会话进阶 | Markdown 渲染与代码高亮、消息编辑与分支、附件与图片上传、工具调用卡片 |
| 轮播进阶 | 多图并列（slidesPerView）、缩略图导航、无限滚动 |
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
