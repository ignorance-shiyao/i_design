# 实施计划

按批次推进，每批 3–4 项，一批做完即提交。
每一项都要**各端齐备 + 浏览器实测**才算完成，覆盖矩阵不得回退。

进度以站内「组件全景」页（`src/data/componentCatalog.ts`）为准——
那里的 `ready` / `planned` 是唯一事实，本文件只排顺序。

---

## 第 1 批 · 补完浮层与文件类型的其余端

前几轮在 Vue 3 上做完了，其余端还欠着。**先还债，再加新组件**——
否则「各端一致」这条承诺会先烂在这里。

- [x] **Tooltip / Popconfirm 接入 `logic/overlay`**（已完成，各端齐备）
  - React 两个组件改为 `resolveOverlay` + fixed 定位 + Portal
  - Vue 2：Teleport 换 `_Portal`，加入 `convert.mjs` 人工清单
  - 小程序：`boundingClientRect` 查位置，箭头跟随触发元素中心
  - Flutter：`i_tooltip.dart` / `i_popconfirm.dart` 接 `resolveOverlay`
  - 验收：贴视口右缘与底部时自动翻转、推回，箭头仍指向触发元素
- [x] **文件类型样式铺到其余端**（已完成，并加了 TS/Dart 映射一致性校验）
  - `logic/file.ts` 已就绪，6 个类型图标已进图标库
  - React / 小程序 / Flutter 的 PromptInput 附件条 + Upload 文件列表
  - 验收：同一个 `.webp` 在附件条与上传列表显示同一图标与配色
- [x] **发送按钮靠右修复**（改的是共享 CSS，各端同时生效）

## 第 2 批 · 动效

不是给每个组件加动画，而是**先定规则再落地**，否则各处时长与曲线各写一套。

- [ ] **补动效令牌**：在现有 `--i-motion-fast/base/slow` 之外补进出场曲线
      （`--i-motion-easing-in` / `-out` / `-spring`），并说明各自的用途
- [ ] **列表进出场**：表格行、通知、附件条、消息用统一的 `TransitionGroup` 模式，
      含 `-move` 过渡，删除中间项时其余项平滑补位而不是瞬移
- [ ] **折叠与展开**：Collapse、Menu 子级、Tree 分支统一用 grid-template-rows 过渡，
      高度未知时也能动（`max-height` 猜值会在长内容上突变）
- [ ] **按压反馈**：按钮、菜单项、单元格的 `:active` 给一次极短的缩放，
      移动端尤其需要——没有 hover，按下去没反馈就像卡住
- [ ] **骨架屏与加载态**：扫光方向与阅读方向一致
- [ ] **全部尊重 `prefers-reduced-motion`**，并接入主题面板的动效开关

## 第 2.5 批 · AI 组件补齐（对照 beautifului.dev 的 21 个形态）

现有的 7 个（消息、输入台、推理过程、工具调用、来源、追问、打字）只覆盖了
「一问一答」。真正缺的是**智能体在做事时**需要的那些形态——它要征求同意、
要报告进度、要给出带置信度的建议、要展示它读了哪些资料、要提出成批的改动。

已有但能力不足：
- [ ] **Loading State**：现有 ILoading 只有转圈。补「已耗时」计时与多种律动形态——
      智能体等待动辄十几秒，不显示已等多久，用户会以为卡死
- [ ] **Thinking 可展开轨迹**：现有 IChatThinking 只折叠一段文字。
      改为分步轨迹（推理 / 搜索 / 编码），每步可单独展开
- [ ] **Prompt Bar 增强**：@ 引用来源、/ 命令、模型选择、语音输入

完全缺失，按「智能体工作流」的顺序排：
- [x] **Approval Card 征求确认**：智能体行动前的人类介入。单选/多选 + 自由输入，
      多问题时分页（1/3），可跳过。这是人机协作里最关键的一环
- [x] **Task Rows 任务行**：进行中 / 失败 / 完成的实时状态，可展开看细节
- [ ] **Tool Chips 工具芯片**：把工具调用压缩成一行芯片，附带改动统计
      （`flavors.css +13`、`ChurnSchedule.tsx +74 -41`）
- [x] **Recommendation Card 建议卡**：智能体的主动建议 + 置信度计量 + 采纳/换一个
- [x] **Context Cards 上下文卡**：检索到的知识片段与它们的出处，
      标出字符数与来源文件类型（复用 logic/file 的类型识别）
- [x] **Diff Table 差异表**：智能体提出的成批表格改动，逐行可勾选，底部「应用 N 处」
- [ ] **Insight Cards 洞察卡**：分页的洞察 + 可擦洗的实时图表（复用现有图表能力）
- [ ] **Selection Actions 选区操作**：选中一段文字后就地交给智能体改写
- [ ] **Code Block 代码块**：带行号的列表与统一 diff 视图（站点内已有实现，抽成组件）
- [ ] **Command Search 命令搜索**：实时过滤 + 空状态，Cmd+K 唤起
- [ ] **Fine-tune Card 属性检查器**：智能体调整设计属性时的面板
- [ ] **Agent Screen 智能体屏幕**：观看智能体操作屏幕，含工作中/加载中状态

排序理由：Approval / Task Rows / Recommendation / Context / Diff Table 这五个
是「智能体替你做事」的核心叙事，优先做完；Fine-tune Card 与 Agent Screen
偏向特定产品形态，排最后。


## 第 3 批 · 表单类补齐（Semi / NutUI 交集）

- [ ] **AutoComplete 自动完成**：边输入边给候选。可复用 `logic/select` 的键盘移动
      与 `logic/overlay` 的定位
- [ ] **TagInput 输入标签**：回车成标签、退格删末项、粘贴批量拆分
- [ ] **TimePicker 时间选择**：时分秒与范围。列滚动选择的逻辑可与 Picker 共用
- [ ] **Transfer 穿梭框**：两栏搬运、搜索、全选。选中态可复用 `logic/tree` 的半选推导

## 第 4 批 · 展示类

- [ ] **Image 图片预览**：点击放大、滚轮缩放、多图切换、键盘左右
- [ ] **Carousel 走马灯**：自动播放、指示点、触摸滑动。与移动端 Swiper 共用一份手势逻辑
- [ ] **Calendar 日历**：按月查看与标记日程，含区间选择。复用 `logic/date`
- [ ] **ColorPicker 颜色选择**：取色面板 + 预设色板。
      色彩换算直接用 `logic/palette` 的 OKLCH 实现，不再引第二套

## 第 5 批 · 布局与页面级

- [ ] **Layout 页面框架**：顶栏 + 侧栏 + 内容区的整页骨架，与 Menu 配套
- [ ] **Splitter 可拖拽分栏**：拖动分隔条改变两栏宽度，含最小宽度与双击复位
- [ ] **Sticky 吸顶** 与 **BackTop 回到顶部**
- [ ] **FloatButton 悬浮操作按钮**：移动端常驻主操作入口
- [ ] **Watermark 水印**：页面级防泄露标记，需防止用 DevTools 直接删节点

## 第 6 批 · 图表补齐（ECharts / Highcharts 交集）

已从 Highcharts 的 `SeriesOptionsType` 枚举出真实类型，与 ECharts 取交集后仍缺：

- [ ] **dataZoom**：图表下方的区间缩放条 + 框选放大。逻辑放 `logic/chart`
- [x] **boxplot 箱线图**：统计分布，两家都有
- [x] **waterfall 瀑布图**：增减归因
- [ ] **sankey 桑基图** 与 **treemap 矩形树图**：流量与层级占比，
      可复用 `logic/tree` 的索引

## 第 7 批 · 流程图补齐（LogicFlow）

连线走向与撤销重做已完成，剩下：

- [ ] **框选**：拖拽矩形多选节点，配合批量移动
- [ ] **缩略图 minimap**：大图时的导航
- [ ] **节点缩放**：拖拽边角改变尺寸
- [ ] **快照导出**：Web 序列化 SVG、Flutter 走 `RepaintBoundary`、
      小程序走 `canvasToTempFilePath`——三端机制不同，不强求同一份实现

## 第 8 批 · 移动端补齐（NutUI）

- [ ] **Swiper 走马灯**（与第 4 批的 Carousel 共用手势逻辑）
- [ ] **无限滚动加载**
- [ ] **NumberKeyboard 数字键盘**：金额与验证码场景
- [ ] **Tour 新手引导**：分步指向界面上的关键位置，定位复用 `logic/overlay`

## 长期

- [ ] **Mention 提及**：输入 @ 唤起人员候选
- [ ] **会话列表**：多轮会话的切换与管理
- [ ] Tooltip / Popconfirm 之外，检查是否还有组件在用一次性的定位实现

---

## 每一项的完成标准

1. 算法进 `packages/common/src/logic/`，纯函数，附断言测试
2. 样式进 `packages/common/src/styles/components/`，只引用语义令牌
3. Vue 3 源 → 转换出 Vue 2 → React → 小程序 → Flutter
4. Flutter 的期望值由 TS 侧算出写进 golden test
5. 文档页 + `componentCatalog` 状态改为 `ready`
6. `npm run check:parity` 全绿，Playwright 实测关键交互
