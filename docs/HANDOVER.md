# i_design 交接文档

给接手实现的人/工具。目标是让你**不需要读完全部代码**就能安全地加东西：
读完本文,你应当知道每一类改动该落在哪个文件、哪些文件不能手改、以及怎么证明改对了。

仓库:`ignorance-shiyao/i_design` · 开发分支 `claude/devui-design-reference-exzjpm`
本文对应版本:commit `1da31a5` 之后。

---

## 1. 这个项目是什么

一套设计体系,不是"一个组件库"。同一套设计决策同时落到七个端:

| 端 | 目录 | 技术 |
| --- | --- | --- |
| Vue 3 | `src/components`(源头) → `packages/vue-next` | SFC `<script setup>` |
| Vue 2.7 | `packages/vue` | 由 Vue 3 源**转换**生成 |
| React | `packages/react` | 函数组件 |
| 小程序 | `packages/miniprogram` | 原生自定义组件 |
| 移动端 Vue | `packages/mobile-vue` | 复用 Web 组件 + 移动专有形态 |
| 移动端 React | `packages/mobile-react` | 同上 |
| Flutter | `packages/flutter` | Dart |

核心约定一句话:**令牌、图标、交互算法只存在一份(`packages/common`),各端只写渲染适配。**

当前规模:117 个令牌 · 40 个图标 · 五端组件覆盖 64/64 · 移动专有组件 12 个。

---

## 2. 目录地图

```
src/                        文档站(也是 Vue 3 组件的源头)
  components/               ★ Vue 3 组件源头,改这里
  data/                     站点数据,多数是生成的(见第 4 节)
  pages/                    文档站页面
packages/
  common/                   ★ 跨端共享层
    src/tokens/index.ts     ★ 令牌唯一数据源
    src/icons/index.ts      ★ 图标唯一数据源(SVG path)
    src/logic/*.ts          ★ 与框架无关的纯逻辑(见下)
    src/styles/components/  ★ 组件 CSS(BEM),各 Web 端共用同一份
    scripts/build-tokens.mjs  令牌编译器
  vue-next/ vue/ react/ miniprogram/ mobile-*/ flutter/
scripts/                    跨端构建与校验脚本
```

`packages/common/src/logic/` 现有:`avatar chart countdown date flow number pagination
picker select table toast upload validate`。**任何"算法"都应该落在这里**,而不是写在某个端的组件里——
它是 Web / 小程序 / Flutter 三套渲染共用的同一份真值。

---

## 3. 不能手改的文件(会被覆盖)

这些由脚本按目录生成。手改的内容下一次构建就没了,而且不会有任何报错:

| 文件 | 生成者 |
| --- | --- |
| `packages/common/src/styles/tokens*.css`、`dist/tokens/*` | `build-tokens.mjs` |
| `packages/flutter/lib/src/tokens/tokens.dart` | `build-tokens.mjs`(直写进包) |
| `packages/common/src/styles/index.css` | `build-styles-index.mjs` |
| `packages/vue-next/**`(整个目录) | `build-vue-next.mjs`,从 `src/components` 复制 |
| `packages/vue/src/components/**`(除人工清单) | `packages/vue/scripts/convert.mjs` |
| `packages/react/src/index.ts` | `build-react-index.mjs` |
| `packages/flutter/lib/i_design.dart` | `build-barrel.mjs` |
| `packages/miniprogram/src/components/*/index.json`、`index.wxss` | `scaffold.mjs` |
| `src/data/componentMatrix.ts`、`frameworkStats.ts` | `build-component-matrix.mjs`、`build-framework-stats.mjs` |

**为什么全都生成**:手写清单必然会漏,而漏掉不会让构建失败。这个仓库真实发生过——
React 端 17 个组件实现了却从未导出;移动端三个组件样式没进汇总入口,数值检查全绿而界面是裸的。
所以"清单类"文件一律按目录生成。

---

## 4. 加一个组件的标准流程

以加 `IFoo` 为例:

1. **算法先落 common**。任何计算(布局、取值、格式化、状态机)写进
   `packages/common/src/logic/foo.ts` 并从 `src/index.ts` 导出。组件里只留渲染。
2. **样式落 common**。`packages/common/src/styles/components/foo.css`,BEM 命名 `i-foo__part`,
   **只引用语义令牌** `var(--i-color-*)`,不写死色值与尺寸。跑 `npm run build:styles` 汇总。
3. **写 Vue 3 源**:`src/components/IFoo.vue`,并在 `src/components/index.ts` 导出
   (有校验项盯着这个,漏了会失败)。
4. **React**:`packages/react/src/components/Foo.tsx`,复用同一份 CSS 与同一份 logic。
5. **Vue 2**:通常不用写,跑 `node packages/vue/scripts/convert.mjs` 由 Vue 3 转换。
   只有多根模板 / Teleport / 命令式挂载 / v-model 语义特殊的,才进 `convert.mjs` 的人工清单。
6. **小程序**:`packages/miniprogram/src/components/foo/index.js` + `index.wxml`。
   `index.json` 与 `index.wxss` 由 `scaffold.mjs` 生成,别手写。
7. **Flutter**:`packages/flutter/lib/src/components/i_foo.dart`,逻辑用 `lib/src/logic/` 的 Dart 版
   (与 TS 版同名同算法,有 golden test 兜底)。
8. 跑第 5 节的校验,全绿再提交。

**移动专有形态**(NavBar / Tabbar / Popup / SwipeCell / Picker 这类)只放 `mobile-vue` 与 `mobile-react`,
不进 Web 五端矩阵。

---

## 5. 怎么证明改对了

```bash
npm run build          # 令牌编译 + 类型检查 + 站点构建
npm run check:parity   # ★ 跨端一致性,10 项,包含下面所有子检查
npm run check:mp       # 小程序静态校验
npm run check:flutter  # Flutter 校验 + golden test
```

`check:parity` 的 10 项在查什么(理解它们比记住命令重要):

1-3. CSS / WXSS / JSON 三份令牌产物数量与逐值相等
4. Dart 颜色与 CSS 等价——**读的是 `packages/flutter/lib/` 里那份,不是 `dist`**。
   曾经因为读 dist,"令牌已同步"通过了校验而 Flutter 端什么都没拿到。
5. Dart 尺寸声明为 `double`(整数会让 `EdgeInsets` 编译失败)
6. 共享样式无全局泄漏的通用选择器
7. Vue 2 产物无 Vue 3 专有语法
8. Avatar 调色板 TS 与 Dart 一致
9. `@i-design/vue-next` 与 `src/components` 逐字节同步
10. `src/components` 的组件都已在 `index.ts` 导出

小程序校验额外查:四件套齐全、JS 可解析、`styleIsolation: apply-shared`、
WXML 用到的类名在 WXSS 里有规则、`usingComponents` 声明齐全
(漏声明不会报错,那个标签只是渲染成空白——最难查的一类)。

> **一条贯穿整个项目的经验**:"构建通过"不等于"能用"。
> 这个仓库里几乎每一个真实缺陷——移动端布局错乱、iOS 输入框自动放大、堆叠面积图配色串色、
> 环形流程图分层错误、Flutter 令牌陈旧、CI 因 peer 冲突全红——**构建全都是绿的**。
> 所以:改了界面就用 Playwright 真跑一遍看截图;改了依赖就在 `git archive` 出的干净树里验证。

---

## 6. 两条硬规则

**其一:图标不用 emoji。** 图标一律走 `packages/common/src/icons/index.ts` 的 SVG path,
小程序用 CSS mask 跟随 `currentColor`。

**其二:图表配色不靠眼睛挑,靠脚本判。** 分类色板必须过六项校验
(明度带、彩度下限、色觉障碍模拟下的相邻 ΔE、常色视觉 ΔE 硬下限 15、对比度、只用文档色板)。

由此产生一条容易被误解的约束,写在 `logic/chart.ts` 里:

```ts
export const SCATTER_MAX_SERIES = 3
```

散点是**任意两点都可能相邻**的形态,配色必须按"所有两两组合"而不是"相邻组合"校验。
在这个更严的口径下,本体系的分类色只有前三槽在亮/暗两种模式下同时通过
(第四槽与品牌蓝的常色差 ΔE 仅 10.8,低于 15 的硬下限)。
**超出三个系列时正确的做法是合并为「其他」或拆成小图,而不是再调一个颜色。**
散点、气泡、地图、小倍数图都适用这条。

---

## 7. 待办(按参考体系分组)

已完成的不再列。以下是真实缺口,按"能立刻动手"的粒度写:

### 图表(对照 ECharts / Highcharts)
从 Highcharts 的 `SeriesOptionsType` 联合类型里枚举出真实 series 名,与 ECharts 取交集后
本体系仍缺的是下面这些(其余多为金融指标线,中后台用不上):
- [ ] **dataZoom**:图表下方的区间缩放条,以及框选放大。逻辑放 `logic/chart.ts`,五端各接一次
- [ ] **箱线图 boxplot**、**瀑布图 waterfall**:统计分布与增减归因,两家都有
- [ ] **桑基图 / 树图**:流量与层级占比
- [ ] **图表导出**:导出 PNG / SVG。Web 端可由 SVG 序列化,Flutter 走 `RepaintBoundary`,
      小程序走 `canvasToTempFilePath`——三端机制不同,注意不要强求同一份实现

### 流程图(对照 LogicFlow)
- 连线走向(polyline / straight / bezier)与撤销重做**已完成**,剩下:
- [ ] **框选**:拖拽矩形多选节点,配合批量移动
- [ ] **缩略图 minimap**:大图时的导航
- [ ] **节点缩放**:拖拽边角改变节点尺寸
- [ ] **快照导出**

### 移动端(对照 NutUI)
- Picker / SearchBar / CountDown / SwipeCell / NoticeBar **已完成**,剩下:
- [ ] **日历 Calendar**:按月查看与标记,含区间选择
- [ ] **走马灯 Swiper**
- [ ] **无限滚动加载**
- [ ] **回到顶部 BackTop** 与 **吸顶 Sticky**
- [ ] **数字键盘**:金额与验证码场景

### 中后台(对照 Semi Design)
Dropdown / Popover / Tree / TreeSelect / Cascader **已完成**,并沉淀了两份共享逻辑:
`logic/overlay.ts`(翻转避让、贴边推回、主轴对齐)与 `logic/tree.ts`(拍平索引、
半选传播、禁用继承、搜索命中路径、级联列)。后续同类组件应当复用它们,而不是另起一份。

剩下:
- [ ] **Tooltip 与 Popconfirm 接入 `logic/overlay`**——这两个目前仍是纯 CSS 定位,
      没有视口避让。接上去之后四处浮层的行为才真正统一(优先做这条)
- [ ] **导航菜单 Menu**:侧栏/顶栏多级,可复用 `logic/tree` 的展开态
- [ ] **穿梭框 Transfer**、**自动完成 AutoComplete**、**输入标签 TagInput**
- [ ] **通知 Notification**(角落、带操作,区别于已有的 Message)
- [ ] **时间选择 TimePicker**、**页内锚点 Anchor**、**图片预览**、**页面框架 Layout**

站内「组件全景」页(`src/data/componentCatalog.ts`,路由 `/design/catalog`)是这份待办的
用户可见版本,新增组件时记得把对应条目从 `planned` 改成 `ready`。

---

## 8. 几个容易踩的坑

- **`.npmrc` 里的 `legacy-peer-deps=true` 不要删。** 仓库同时维护 Vue 2.7 与 Vue 3 两套实现,
  peer 冲突是刻意的架构而非待修的依赖错误。删掉会让 CI 的 `npm ci` 直接失败。
- **改了 `src/components` 一定要跑 `build:vue-next`**,否则校验第 9 项会失败。
- **小程序没有 SVG**,图形走 `canvas type="2d"`,记得按 `devicePixelRatio` 缩放,
  否则在高分屏上是糊的。但**需要被读屏读到的数值不要画进 canvas**——
  热力图就是因此用 `view` 排格子而非 canvas。
- **Flutter 的透明色**用 `Color.fromRGBO(c.red, c.green, c.blue, 0.22)`:
  `withOpacity` 已废弃,`withValues` 要 3.27+。
- **文档站文案从产品自身视角写**:不写"对标某某库"、不写"抄自哪里"、不报组件数量作为卖点。

---

## 9. 一次改动的完整例子

想加 Dropdown,推荐顺序:

```bash
# 1. 抽公共定位逻辑
vim packages/common/src/logic/overlay.ts        # 触发/翻转/外部点击
vim packages/common/src/index.ts                # 导出

# 2. 样式
vim packages/common/src/styles/components/dropdown.css
npm run build:styles

# 3. 各端实现
vim src/components/IDropdown.vue                # Vue 3 源头
vim src/components/index.ts                     # 导出(校验项 10 会查)
vim packages/react/src/components/Dropdown.tsx
node packages/vue/scripts/convert.mjs           # Vue 2 自动转换
vim packages/miniprogram/src/components/dropdown/index.{js,wxml}
vim packages/flutter/lib/src/components/i_dropdown.dart

# 4. 目录页状态
vim src/data/componentCatalog.ts                # planned → ready

# 5. 全量校验
npm run build && npm run check:parity
```

提交前确认 `git status` 干净、五端覆盖矩阵没有回退。
