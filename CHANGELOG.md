# 变更记录

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本策略见 [VERSIONING.md](VERSIONING.md)。

各端的包共用同一个版本号，一起发布。

## [未发布]

### 新增

- 能力注册表：各端源码路径、是否从入口导出、成熟度、状态集、文档入口与演示数，
  全部按目录生成（`npm run check:registry`）。
- 外部安装烟测：包 pack 出来装进仓库外的干净项目，过类型、打包、渲染与样式
  （`npm run check:install`）。
- SSR / hydrate / CSP 检查（`npm run check:ssr`）。
- 样式禁令检查：加粗状态边线、渐变填充、写死的白字、图标里的 emoji
  （`npm run check:style-rules`）。
- 许可证随包分发，素材来源逐个登记（`LICENSE`、`THIRD-PARTY.md`）。
- 运行事件契约与 reducer：乱序、重发、迟到、取消后续写都有明确处理。
- `IPageState`：一块内容区的七种状态（加载/空/无权限/失败/离线/部分成功/过期），
  判定在共享层，各端只做渲染。
- 传输适配层：SSE 解码、断线重连带恢复游标、取消、幂等键。
- `GraphDocument`：流程文档的解析、版本迁移与校验；往返无损（不认识的字段原样留着），
  不认识的节点标成只读占位而不是丢弃，读到更新的版本时拒绝。
- 图表联动内核：统一的 SelectionEvent、下钻压栈与返回弹栈、循环联动终止。
- 图表新增百分比堆叠（`percent`）、阶梯线（`curve="step"`）与目标线（`target`），
  各端同源；百分比的分母做了验证，零总量与含负值的列不换算并在图下说明。
- `IChartFrame`：图的外框与出口——标题、口径、数据表、CSV 下载、数据质量提示；
  表格与图同源，缺失值显示「—」。`IChart` 新增 `exits` 以便关掉自带的出口。
- 图表数据集契约（ChartDataset / ChartSpec）与数据质量判定：缺失值不补零，
  单点/全零/负数/NaN/缺维度/混单位各自有定义，时间按字段自带的时区分桶。
- `IMessageParts`：一条消息的多段混排（正文/推理/代码/工具/产物/引用），
  引用角标可点可定位，未收完的段不给复制按钮。
- 代码染色加阈值：超过 600 行（流式中 200 行）改渲染纯文本，
  否则流式输出时每来一片都会把整块重染一遍，输入框会卡住。
- `IMarkdown`：Markdown 解析成 token 树而不是 HTML 字符串，各端共用一套解析；
  原始 HTML 当纯文本，地址过白名单，流式停在代码块中间也不跳变。
- 会话管理：归档视图、重命名、可撤销删除、分页，以及打不开的会话分
  「没权限」与「已失效」两种原因显示（`IChatList` 各端同步）。
- 图标元数据（中文名、语义域、业务别名）与按业务词检索。
- 补齐设备/网络、采购/物流、财务/合同、地图、安全审计、移动手势六个语义域的图标。
- 单图标按需引入：`@i-design/common/icons` 每个图标一个具名常量，
  配合 `IIcon` 的新 `path` 属性，只带走用到的那一条（实测 0.1 kB）。
- Patterns Lab（`/design/lab`）：每个组件按注册表自动出现并真的渲染一次，
  `npm run check:lab` 盯着「只剩一个名字」的情况。

### 修复

- 插画不再随主入口分发：移到 `@i-design/common/illustrations` 子路径，
  并在各端构建里外置。此前 Vite 的 library 模式把十八张绘画稿内联成 data URI，
  内联之后摇树也摇不掉——只引一个按钮的使用方要背走整套图。
  实测：只引一个按钮从 815 kB gzip 降到 9.0 kB。
  **如果你在用 `emptyIllustrations` / `errorIllustrations` / `heroIllustrations` /
  `mascotIllustration`，把 import 改成 `@i-design/common/illustrations`。**

- `notification` 的列表从模块顶层的 `reactive([])` 改为 `ref`：
  Vue 2.7 不接受数组作为 reactive 的根，导致 watch / watchEffect 跟踪不到。
- `IDropdown` 的纯文本触发器补上 `role="button"` 与 `tabindex`：
  此前只挂了 `aria-haspopup`，它挂在一个没有角色的 span 上既是无效 ARIA，
  键盘也聚焦不到——纯文本触发器只有鼠标能用。Vue 与 React 两端都改了。
- 第三级文字色由 `#6b7080` 压到 `#686d7d`：在第三档底色 `#eef0f5`
  （填充面板、演示区）上原先只有 4.33:1，而第三级文字最常出现的就是这种面板。
- 图标的默认尺寸从内联 style 属性挪进 `.i-icon` 类：
  不带 `unsafe-inline` 的 CSP 会拒掉整个 style 属性，图标会塌成 0。

### 弃用

- （无）

## [0.1.0] - 2026-09-01

首个内部版本：各端组件、令牌与文档站。
