# 当前现状 & 后续规划

> 这份文档给接力的人或 AI 看。读完它，你应当能回答三个问题：
> **现在做到哪了、下一步做什么、做完怎么算数。**
>
> 与另外两份的分工：`HANDOVER.md` 讲「怎么改」（目录地图、不能手改的文件、标准流程），
> `ROADMAP.md` 是早期按批次排的清单（已部分过期，见 F1）。本文是**现状盘点 + 任务台账**，
> 有冲突时以本文为准。

最后校准：2026-09-12，对应 `main` 分支。文中所有数字都取自生成物
（`src/data/componentMatrix.ts`、`src/data/frameworkStats.ts`、golden test），
不是手填的——手填的数字会过期，而且过期了没人发现。

---

## 0. 目标

做一套**覆盖通用组件 + 流程图 + AI 交互**的多端组件库，配一个**能配参数的完整示例站**。

拆成五条线，后面的任务都挂在这五条线上：

| 线 | 含义 | 现在的成色 |
| --- | --- | --- |
| **A 通用组件** | 中后台日常要用的那些 | 基本齐了，剩零散补漏 |
| **B AI 交互** | 智能体在做事时需要的形态 | 一问一答齐了，智能体工作流缺一半 |
| **C 流程图** | 画布、节点、连线、导出 | 主干齐了，编辑体验待补 |
| **D 示例站与参数配置** | 看得见、调得动 | 主题能调，**组件参数还不能调** |
| **E 交付与质量** | 别人真的能装上用 | **包装不出去**，是当前最大的短板 |

---

## 1. 现状盘点

### 1.1 架构

一套设计决策落到多个端，令牌、图标、交互算法**只存在一份**：

```
packages/common/src/
  tokens/     设计令牌（编译成 CSS 变量 / Dart 常量 / 小程序 wxss）
  icons/      50 个内联 SVG path
  logic/      44 个纯逻辑模块，各端共用
  styles/     组件样式，只引用语义令牌

src/components/          Vue 3 源头（也是文档站在用的那一份）
  ↓ 脚本转换
packages/vue-next/       Vue 3 发布包
packages/vue/            Vue 2.7（由 Vue 3 源自动转换 + 18 个人工实现）
packages/react/          React
packages/miniprogram/    原生小程序自定义组件
packages/flutter/        Dart
packages/mobile-{vue,react}/  复用 Web 组件 + 移动专有形态
```

**这条约定是这个项目最值钱的部分**，改动时别破坏它：算法进 `logic/`，
各端只写渲染适配；任何一端偷偷自己实现一遍，两端就会在某个边界条件上分叉，
而那种分叉不会让构建失败。

### 1.2 组件盘点

覆盖矩阵（按文件存在与否统计，`build:matrix` 生成）：五端各 **117** 个，一致。

| 分类 | 数量 | 备注 |
| --- | --- | --- |
| 基础 | 8 | Button / Icon / Tag / Divider / Link / Layout / StickyTool / Scrollbar |
| 导航 | 4 | Tabs / Breadcrumb / Steps / Pagination |
| 数据录入 | 24 | 含 Form、Select（多选 + 虚拟化）、DatePicker、TimeSelect、InputOtp 等 |
| 数据展示 | 16 | 含 Table（虚拟化）、Tree（虚拟化）、Qrcode、Countdown 等 |
| 消息反馈 | 9 | 含命令式 `message` / `confirm` / `notification` |
| 图表 | 13 | 折线柱状面积 / 饼环 / 散点 / 热力 / 雷达 / 漏斗 / 仪表 / 箱线 / 瀑布 / 桑基 / 矩形树 / 区间缩放 / 迷你图 |
| 流程图 | 4 | 画布 / 框选 / 缩略图 / 快照导出 |
| AI 会话 | 9 | 见 1.3 |
| 移动端 | 13 | 另有 19 个移动专有组件在 `packages/mobile-*` |

近期（本轮）补的：InputOtp、CheckTag、PageHeader、ButtonGroup、TimeSelect、
Scrollbar、Countdown、命令式确认框、文本截断提示、ConfigProvider 与文案字典；
Select / Tree / Table 三个加了虚拟化与多选。

### 1.3 AI 交互组件

**已有**：ChatMessage（消息气泡）、PromptInput（输入台）、ChatThinking（思考过程）、
ChatToolCall（工具调用）、ChatSources（来源）、ChatSuggestions（追问）、
ChatTyping（打字）、ApprovalCard（征求确认）、AgentTasks（任务行）、
RecommendCard（建议卡）、ContextCards（上下文卡）、DiffTable（差异表）。

**缺口**（智能体工作流里真正会用到、但现在做不出来的形态）：
工具芯片、洞察卡、选区操作、代码块、命令搜索、属性检查器、智能体屏幕，
以及 Loading 的「已耗时」、Thinking 的分步轨迹、PromptInput 的 `@` 与 `/`。
任务见 B 组。

### 1.4 流程图

画布、节点、连线走向、撤销重做、框选批量移动、缩略图、节点缩放、快照导出都有了。
快照导出三端机制不同（Web 序列化 SVG 并内联令牌、Flutter 走 `RepaintBoundary`、
小程序走 `canvasToTempFilePath`），但导出的都是整张图且都先摘掉编辑器界面件。

缺的是**编辑体验**：对齐辅助线、连线锚点选择、节点分组、自动布局。任务见 C 组。

### 1.5 示例站

- 路由 68 条，页面结构：设计价值观 / 设计令牌 / 跨端支持 / 组件全景 / 逐组件文档页
- 每个示例块（`DemoBlock`）可展开源码，部分组件带跨端代码片段（`FrameworkTabs`）
- 站点用 hash 路由，部署在子路径下不需要服务端改写
- 主题面板 8 个分区：色彩 / 字体 / 圆角 / 阴影 / 尺寸 / 质感 / 动效 / 导出，
  配置项包括主题色与三个语义色、中性色偏移强度、字号与行高（可逐档滑块微调）、
  圆角、阴影强度、密度与控件高度、液态玻璃开关与强度、动效开关与速度、主题切换过渡，
  并能导出成 CSS 变量

**最大的短板**：站点能调**主题**，但调不了**组件参数**。
现在只有 QrcodePage 手写了一个 playground，其余页面的示例都是写死的。
用户想看「`size=lg` + `disabled` + 多选 长什么样」，只能读代码自己脑补。任务见 D1。

### 1.6 质量基建

已有的自动校验（`npm run check:parity` 串起来，CI 在 push 到 main 时跑）：

| 检查 | 挡住的问题 |
| --- | --- |
| `check-parity.mjs`（12 项） | 令牌/图标/逻辑各端不一致、组件建了文件没导出 |
| `check:mp` | 小程序四件套缺文件、JS 解析失败、样式隔离写错、图标未定义 |
| `check:flutter` | Dart 尺寸声明成整数、组件缺失，并生成 **925 条** golden 断言 |
| `check:snippets` | 跨端代码片段与真实 API 对不上 |
| `check:scoped-css` | `<style scoped>` 编译后丢了 data-v 属性（曾导致整站发灰） |
| `check-theme-readability.mjs` | 深色模式对比度不足、主题令牌残留 |
| `build:matrix` / `build:stats` | 覆盖数字手填过期 |

Flutter 的期望值由 TS 侧算出写进 golden test——**这是跨端一致性的主要保险**，
新增共享逻辑时务必同步加断言，否则 Dart 端可以悄悄写出另一套算法。

**缺口**：没有 TS 侧的单元测试跑起来（逻辑只在 Dart golden test 里被间接验证）、
没有无障碍自动检查、CI 只在 push 时跑不在 PR 上跑。任务见 E 组。

### 1.7 已知的坑与债

- **包发不出去**：`packages/*` 的 `main` 指向 `src/index.ts`，没有构建产物、
  没有类型声明、没有 `exports` / `files` 字段。也就是说现在**没人能 `npm install` 用起来**。
  这是「组件库」这个定位下最硬的短板。→ E1
- **CI 触发分支过期**：`deploy.yml` 里写着 `claude/devui-design-reference-exzjpm`，
  那个分支早没了；而 PR 上不跑任何检查。→ E2
- **两个覆盖数字对不上**：矩阵按文件数（五端各 117），frameworkStats 按导出名
  （117/118/116/119/110）。两者量的不是一回事，但站点上并排显示会让人以为哪个错了。→ E4
- **站上的「组件全景」在说假话**：`src/data/componentCatalog.ts` 里有 15 项标着
  `planned`，其中 **13 项早就做完了**（页面框架、可拖拽分栏、时间选择、穿梭框、
  自动完成、提及、颜色选择、图片预览、走马灯、日历、新手引导、水印、吸顶）。
  真正还缺的只有悬浮操作按钮（Web 端）与会话列表。
  选型的人看到的是「这里没有」，于是走了。→ **F0**
- **两份目录并存且不同步**：`componentCatalog.ts`（组件全景页，94 项，
  带 `excluded` 状态）与 `components.ts`（组件总览页，101 项）各记一份，
  已经漂开了。→ F0
- **文档过期**：`HANDOVER.md` 写的开发分支 `claude/devui-design-reference-exzjpm`
  已不存在；`ROADMAP.md` 有 32 个未勾选项，其中近一半实际已完成。→ F1
- **跨端 API 差异查不出来**：`check:parity` 只比「组件在不在」，比不到「属性一不一样」。
  已知 Input 的 `clearable` 在 Vue 端有、React 端没有。→ E3
- **动效没有统一规则**：`--i-motion-fast/base/slow` 有，进出场曲线
  （`easing-in` / `-out` / `-spring`）没有；`prefers-reduced-motion` 只在 4 个组件里零散照顾到。→ A3

### 1.8 远端分支现状

`main` 是唯一基准。除它之外远端还留着五个分支，**其中三个有未合并提交，
但都不该直接合**——记在这里，免得下一个人重新查一遍：

| 分支 | 未合并 | 该怎么处理 |
| --- | --- | --- |
| `claude/bold-bohr-fl0nig` | 0 | 已并入 main，可删 |
| `claude/cross-framework-component-library-2wawj9` | 0 | 已并入，可删 |
| `redesign/tdesign-20260911` | 0 | 已并入，可删 |
| `claude/devui-design-reference-exzjpm` | 6 | **只挑不合**：里面的 Gantt 与 WordCloud 正是 A1/A2，值得摘出来；同分支的 IndexBar / PullRefresh 在 main 里已有等价实现（`IIndexes` / `IPullDownRefresh`），摘了会重复；其余四个提交是首页与明暗切换的返工，会把当前这版视觉改回去 |
| `feat/agent-interaction-primitives`（PR #3） | 1 | **已关闭**。分支点在 `03488d2`（重构前），针对的是 `packages/core` + `playground/` + pnpm 那套已经不存在的结构，GitHub 判定为 conflict。它的四个组件（ApprovalCard / TaskList / ContextCard / ToolChip）里前三个 main 已有且更完整，只剩 ToolChip 是真缺的，见 B1。唯一值得留下的想法已抄成 E7 |
| `feat/visual-refresh-20260911` | 1 | 首页与顶栏的另一版样式，与当前基准冲突。除非确认要换，否则删掉 |

处理建议：先从 `devui` 分支 cherry-pick Gantt 与 WordCloud（勾掉 A1/A2），
确认没别的要捞之后，把五个分支一起删掉——留着只会让下一个人反复确认它们是死是活。

---

## 2. 任务台账

任务编号稳定，勾选即完成。**改状态时同步改这里**，不要只在别处记。

优先级：**P0** = 挡住「别人能用上」的；**P1** = 目标里的核心能力；**P2** = 增强。

### E 交付与质量基建（P0 优先）

- [ ] **E1 · 让包真的能装**（P0）
  - 目标：`npm install @i-design/vue-next` 之后 import 得到组件与类型
  - 落点：各 `packages/*/package.json` 补 `exports` / `types` / `files` / `sideEffects`；
    加构建脚本（建议 Vite library 模式 + `vue-tsc --declaration` 出 `.d.ts`）；
    样式产物单独出口（`@i-design/common/styles`）
  - 注意：Vue 2.7 与 Vue 3 两套实现共存是刻意的，
    `.npmrc` 的 `legacy-peer-deps=true` 不能删（删了 CI 的 `npm ci` 直接失败）
  - 验收：在 `git archive` 出的干净树里 `npm pack` 后装进一个空白 Vite 项目，
    Vue 3 / React 各渲染一个按钮 + 一个 Select，类型提示正常，样式生效
  - 依赖：无

- [ ] **E2 · CI 在 PR 上跑，并清掉过期分支名**（P0）
  - 落点：`.github/workflows/`。拆成 `ci.yml`（PR + push 跑 `check:parity`、
    `typecheck`、`build`）与 `deploy.yml`（只在 main 跑部署）
  - 验收：开一个故意破坏一致性的 PR，CI 变红且指出是哪一项
  - 依赖：无

- [ ] **E3 · 跨端属性一致性检查**（P1）
  - 目标：`check:parity` 能发现「Vue 有 `clearable`、React 没有」这类差异
  - 落点：新增 `scripts/check-props.mjs`。从 Vue SFC 的 `defineProps` 与 React 的
    `interface XxxProps` 里抽属性名比对，差异写进白名单才放行
  - 验收：故意删掉 React 某组件一个 prop，检查失败并报出组件名与属性名；
    把已知的 Input `clearable` 差异修掉而不是加进白名单
  - 依赖：E2（让它在 PR 上生效才有意义）

- [ ] **E4 · 统一「覆盖了多少」的口径**（P2）
  - 目标：站点上不再出现两个互相矛盾的数字
  - 落点：`build-framework-stats.mjs` 与 `build-component-matrix.mjs`，
    以及站点上展示它们的页面。要么统一成同一口径，要么在页面上写清楚两者量的是什么
  - 验收：跨端支持页与组件全景页的数字能互相解释

- [ ] **E5 · TS 侧逻辑测试**（P1）
  - 目标：`packages/common/src/logic/*` 有能直接跑的断言，不必绕道 Dart golden test
  - 落点：引入 vitest，按模块写；**优先补那些已经出过 bug 的**：
    `qrcode`（格式信息位序）、`countdown`（取整与并位）、`virtual`（底部空白算法）、
    `overflow`（判定方向）、`locale`（局部覆盖）
  - 验收：`npm test` 通过并接进 CI；故意把 `isTextOverflowing` 的方向写反，测试变红
  - 依赖：E2

- [ ] **E7 · 外链地址加协议白名单**（P2，来自已关闭的 PR #3）
  - 现状：`IChatSources` 与 `IContextCards` 把数据里的 `url` / `href` 直接绑到
    `<a href>` 上，**代码里没有任何协议检查**。今天没被利用是因为两处都带了
    `target="_blank"`，而 Chromium 会拒绝把 `javascript:` 导航到新上下文——
    也就是说安全是浏览器顺手给的，不是我们设计的
  - 为什么要管：这两个组件的数据来自模型与工具输出，是**不可信内容**。
    哪天有人去掉 `target`、或者 Flutter 接上 `url_launcher`、小程序接上 `navigateTo`，
    这道口子立刻变成真的
  - 落点：`packages/common/src/logic/` 加 `safeHref(href)`，只放行
    `http(s)://`、站内相对路径与锚点；协议相对（`//evil.com`）、
    `javascript:`、`data:`、含控制字符的一律返回 undefined。各端绑定前过一道
  - 验收：传 `javascript:alert(1)` 时链接退化成纯文本而不是可点的 `<a>`；
    补 golden 断言把白名单规则钉在各端

- [ ] **E6 · 无障碍自动检查**（P2）
  - 落点：Playwright + axe，遍历文档站路由，亮暗两态各跑一遍
  - 验收：输出违规清单并接进 CI（先只报告不阻断，清零后再改成阻断）

### D 示例站与参数配置（P0/P1）

- [ ] **D1 · 组件参数 playground**（P0，这是「支持配置各种参数」的主体）
  - 目标：每个组件文档页都能现场改属性看效果，不必读代码脑补
  - 落点：新增 `src/site/Playground.vue`，接收一份属性描述
    （名称 / 类型 / 可选值 / 默认值 / 说明）自动渲染控件：
    boolean → 开关，枚举 → 分段器，数值 → 滑块，字符串 → 输入框
  - 关键决定：**属性描述从哪来**。手写会和代码漂移（这个项目里已经有先例）。
    建议从 Vue SFC 的 `defineProps` 类型里抽，生成 `src/data/componentProps.ts`，
    与 E3 共用同一份解析器——一次解析，两处收益
  - 同时输出：当前配置对应的代码片段，可复制
  - 验收：Button / Select / Table / Tree 四个页面接上；
    改 `size` / `disabled` / `multiple` 实时生效；改完的代码片段粘贴出去能跑
  - 依赖：与 E3 共用解析器（可并行开工，先约定好数据结构）

- [ ] **D2 · 全局参数面板补「尺寸」联动**（P1）
  - 现状：ConfigProvider 已经能下发 `size`，但组件还没读它
  - 落点：表单类组件的 `size` 默认值改为读 `useConfig().size`，
    组件自己传了仍然优先（与文案字典同一条规则：字典是兜底不是强制）
  - 验收：把 ConfigProvider 的 size 设为 `lg`，页面上没显式传 size 的输入框、
    按钮、选择器一起变大；显式传了 `sm` 的那个不变

- [ ] **D3 · 文案字典接到其余组件**（P1）
  - 现状：已接 Select / Table / Empty / Pagination / InfiniteScroll / Loading /
    Popconfirm / Typography / Tree / Cascader / DatePicker / TreeSelect / SelectInput
    与所有关闭、清除的无障碍名
  - 还缺：图表的「查看数据表 / 收起数据表」「类别」、AI 组件的「重试 / 重新生成 /
    推理过程 / 引用片段」、ApprovalCard 的「继续 / 跳过 / 其他」、移动端那 19 个
  - 落点：`packages/common/src/logic/locale.ts` 加键，各端组件改读字典
  - 规则：组件自己传了属性优先于字典；新增键要同步 Dart 版并补 golden 断言
  - 验收：切到 `enUS` 后整页没有残留中文（AI 与图表页各截一张图核对）

- [ ] **D4 · 示例站可搜索**（P2）
  - 目标：Cmd+K 搜组件名、属性名、令牌名
  - 与 B7 的命令搜索组件是同一件事的两面：先做成组件，再用它做站点搜索

- [ ] **D5 · 每页补「什么时候不该用它」**（P2）
  - 现在文档页讲了怎么用，没讲什么时候别用（例如「选项少于三个优先用单选框」
    这类话只零散出现在几页）。这类判断比 API 表更值钱

### A 通用组件补漏（P1/P2）

- [ ] **A1 · Gantt 甘特图**（P1）：排期是中后台高频场景，现在完全没有
- [ ] **A2 · WordCloud 词云**（P2）
- [ ] **A3 · 动效规则统一**（P1）
  - 补进出场曲线令牌（`--i-motion-easing-in` / `-out` / `-spring`）并说明各自用途
  - 列表进出场统一用带 `-move` 的过渡：删中间项时其余项平滑补位而不是瞬移
  - 折叠展开统一用 `grid-template-rows` 过渡（`max-height` 猜值在长内容上会突变）
  - 按压反馈：移动端没有 hover，按下去没反馈就像卡住
  - 全部尊重 `prefers-reduced-motion`，并接上主题面板的动效开关
  - 验收：随便挑三个列表类组件删中间一项，其余项是滑过去不是跳过去
- [ ] **A4 · FloatButton 悬浮操作按钮**（P2）：Web 端缺（移动端已有 IFab）。
  与会话列表（B11）是组件全景页里**仅有的两项名副其实的 `planned`**

### B AI 交互组件（P1，这条线缺口最大）

按「智能体替你做事」的叙事顺序排，前四个优先：

- [ ] **B1 · Tool Chips 工具芯片**（P1）
  - 把工具调用压缩成一行芯片，附带改动统计（`flavors.css +13`、`App.tsx +74 -41`）
  - 与已有的 ChatToolCall 的分工要在文档里写清楚：芯片是折叠态，卡片是展开态
- [ ] **B2 · Loading 补「已耗时」**（P1）
  - 智能体等待动辄十几秒，不显示已等多久，用户会以为卡死
  - 落点：ILoading 加计时；规则（多久之后才显示计时、精度）进 `logic/`
- [ ] **B3 · Thinking 分步轨迹**（P1）
  - 现在只折叠一段文字。改成分步（推理 / 搜索 / 编码），每步可单独展开
- [ ] **B4 · PromptInput 增强**（P1）
  - `@` 引用来源（复用 `logic/mention`）、`/` 命令、模型选择、语音输入入口
- [ ] **B5 · Code Block 代码块**（P1）
  - 带行号与统一 diff 视图。站点内 `src/site/CodeBlock.vue` 已有实现，抽成组件各端齐备
- [ ] **B6 · Insight Cards 洞察卡**（P2）：分页洞察 + 可擦洗的实时图表（复用图表能力）
- [ ] **B7 · Command Search 命令搜索**（P2）：实时过滤 + 空状态，Cmd+K 唤起（与 D4 配套）
- [ ] **B8 · Selection Actions 选区操作**（P2）：选中一段文字就地交给智能体改写
- [ ] **B9 · Fine-tune Card 属性检查器**（P2）
- [ ] **B10 · Agent Screen 智能体屏幕**（P2）：观看智能体操作屏幕，含工作中/加载中态
- [ ] **B11 · 会话列表**（P2）：多轮会话的切换与管理

### C 流程图（P2）

- [ ] **C1 · 对齐辅助线**：拖动节点时与邻近节点对齐并吸附，松手后辅助线消失
- [ ] **C2 · 连线锚点选择**：从节点的哪条边出线由用户指定，而不是永远自动选
- [ ] **C3 · 节点分组**：框选后成组，组可整体折叠
- [ ] **C4 · 自动布局**：一键把杂乱的图排成分层结构（复用已有的最长路径分层）

### F 文档与目录校准（P0）

- [ ] **F0 · 修掉「组件全景」页的假信息**（P0，最便宜也最亏的一项）
  - 现状：`componentCatalog.ts` 里 15 项标 `planned`，13 项实际已完成
    （见 1.7）。这是**线上站点在对选型的人说假话**
  - 落点：`src/data/componentCatalog.ts` 逐项核对状态
  - 根治：两份目录（`componentCatalog.ts` / `components.ts`）合成一份，
    或让「做没做完」这一位从**文件是否存在**推出来，别再手填——
    这个仓库里所有手填的清单最后都过期了，而且过期了没人发现
  - 验收：组件全景页上标 `planned` 的，`src/components/` 里确实没有对应文件；
    加一条检查把这件事钉死，让它下次自己失败
  - 依赖：无。**建议第一个做**

- [ ] **F1 · 把 HANDOVER 与 ROADMAP 校准到现状**（P0）
  - `HANDOVER.md`：开发分支名 `claude/devui-design-reference-exzjpm` 已失效
  - `ROADMAP.md`：32 个未勾选项里有近一半实际已完成，逐条核对后勾掉；
    仍未做的合并进本文的任务台账，避免两处各记一份
  - 验收：三份文档里不再有互相矛盾的说法
- [ ] **F2 · 本文保持更新**：每合并一个 PR，把对应任务勾掉并在 1.x 现状里改一句话

---

## 3. 接力约定

### 加一个组件的完整流程

1. **算法进** `packages/common/src/logic/`，纯函数，不碰 DOM
2. **样式进** `packages/common/src/styles/components/`，只引用语义令牌
   （写死色值与尺寸的话，主题面板一调就露馅）
3. **Vue 3 源** `src/components/IXxx.vue` → 跑 `build:vue2` 转 Vue 2 →
   手写 React → 小程序四件套 → Flutter
4. **Dart 期望值由 TS 侧算出**写进 golden test（`packages/flutter/scripts/build-golden-test.mjs`）
5. **文档页** + `src/data/{components,nav}.ts` + 路由
6. `npm run check:parity` 全绿 + **Playwright 实机截图**

### 硬规则（违反即缺陷，哪怕构建全绿）

这三条写在 `CLAUDE.md` 里，这里只提醒最容易踩的：

- **不用加粗/加深的边线表达状态或类型**。状态与类型用「图标 + 淡底色块 + 文字标签」，
  边框保持四边等宽的发丝线。颜色不能是唯一线索
- **元素填充色一律纯色，不用渐变**。纹理与氛围底（点阵、光晕、遮罩、骨架扫光）除外
- **清单类文件一律按目录生成**，手写必然会漏，而且漏掉不会让构建失败

### 「构建通过」不等于「能用」

改了界面就用 Playwright 真跑一遍看截图。本轮就是靠实机截图才发现的：

- Modal 的 watch 没有 `immediate`，命令式对话框挂载时就是打开的，那段逻辑根本不跑——
  Esc 关不掉、背景照样能滚。页面里 `v-model` 切换的用法看不出这个差别
- Scrollbar 的轨道按「需不需要滚动条」`v-show`，而滑块长度要按轨道高度算，
  轨道不在布局里高度就是 0，于是永远算出「不需要」
- CheckTag 的悬停态特指度压过选中态，鼠标停在已选标签上它会变回未选中的样子

### 给 AI 接力的几条

- **先读生成物再读代码**：`componentMatrix.ts` 与 `frameworkStats.ts` 是当前规模的事实
- **不要用 `cat >` 覆盖已存在的文件**。本轮踩过：覆盖 `logic/countdown.ts` 时
  冲掉了移动端 CountDown 依赖的实现。先 `cat` 看一眼再决定是改还是加
- **命令式 API 的宿主不在组件树里**。`message()` / `confirm()` / `notification()`
  挂在 `document.body` 上，inject / context 到不了那里——给它们接上下文要走
  `localeBridge` 那条路，否则接了等于没接，而且看起来像接过了
- **一次一批，做完就合**。每批都要覆盖矩阵不回退、实机验证过、PR 描述写清楚
  「为什么这么做」而不只是「做了什么」

---

## 4. 建议的推进顺序

1. **F0**（1 小时）：先把组件全景页的状态改对。线上正在告诉人「这些没有」，
   而它们都有——这是投入产出比最高的一项
2. **F1 + E2**（半天）：文档与 CI 校准，否则后面每一步都在错的地图上走
3. **E1**（1–2 天）：包能装出去，这个项目才配叫组件库
4. **D1**（2–3 天）：参数 playground，示例站从「能看」变成「能试」
5. **E3 + E5**（1–2 天）：属性差异与逻辑测试，把回归挡在 PR 上
6. **B1–B5**（按批推进）：AI 交互这条线的缺口最大，也最能体现这套库的差异点
7. **A1 / A3 / C 组**：按需求密度插空做

前五步做完，这套库就从「一个漂亮的演示站」变成「别人能装上、能试、改坏了会被拦住」的东西。
