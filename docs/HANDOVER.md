# 交接说明（2026-09-15，第二轮更新）

给下一个接手的会话。读完这一篇就能直接开工，不需要翻完整个仓库。

---

## 1. 现在在哪儿

- 工作分支：**`claude/eloquent-shannon-amg4k8`**（已推送，工作区干净）。
  所有开发都提交到这条分支，不要直接推 `main`。
- 这条分支相对 `main` 有 191 个提交、2104 个文件的改动。`main` 停在合并 PR #1 那一次。
- 计划与进度：**`docs/astra.md`**。第 10 节「进度核对」是按证据核对过的状态表，
  第 10 节末尾「下一步的顺序」是按**阻塞面**排的（不是按好做程度）。
- 本轮已完成并勾掉的：B01 AppShell、B03 QueryFilter、B04+B05 ProTable、
  B07 批量操作栏、B09 表单页形态、B12 详情页、F06 运行状态、F08 确认失效、
  B08 SchemaForm、C03 图标填充变体、C06 插画矩阵、D04 分布图、D13 轴系、
  G02 示例门户、G03 ERP 第一切片（本轮换成组件后转正）。

**下一件事**：`docs/astra.md` §10 的「下一步的顺序」第 10 条 —— **B10 人员 /
组织 / 资源选择**：远程检索、已选回显、禁用原因。难点是「翻页之后已选的还在
不在」与「不可选的那些要说清为什么」——停用的人仍要能读历史记录，
直接过滤掉会让旧单据上的负责人变成一个空格。之后是 B06 树表与 B11 导入导出。

F06、F08、B07、B09、B12 与 G03 已完成（见下面「这一轮做过什么」）。

---

## 2. 硬性规则在哪儿

**`CLAUDE.md` 是硬性规则，违反任何一条都算缺陷**，即使构建通过、测试全绿。
最容易踩的四条：

1. 不许用加粗/加深的边线表达状态或类型（用图标 + 淡底色块，边框四边等宽发丝线）。
2. 元素填充色一律纯色，不用渐变（纹理、氛围底、`mask-image` 例外）。
3. 实心色块上的字用成对令牌 `--i-color-X-solid` / `--i-color-on-X`，不许写死白字。
4. 图标不用 emoji。

另外三条工程约定：

- 令牌、图标、纯逻辑**只存在一份**，放 `packages/common`；各端只写渲染适配。
- **pro 层（ProTable / QueryFilter / SchemaForm / AppShell 这类）与原子组件一样全端**，
  进覆盖矩阵。某端确实做不到的，写进 `packages/common/src/contracts/capability.ts`
  并指名替代路径 ——「暂不支持」这种空话会被 `check:capability` 判红。
- 「清单类」文件一律按目录生成，手写必漏。哪些是生成的，看 `package.json` 里 `build:*`。

---

## 3. 怎么证明改对了

验收标准（`CLAUDE.md` 末尾那段）：

```bash
npm run check:parity     # 串了 31 步，最全的一条；先跑它
npm run typecheck
npm test                 # 440 条
npm run build

# 这三项要真浏览器，必须带 CHROMIUM_PATH
export CHROMIUM_PATH=/opt/pw-browsers/chromium
npm run check:a11y         # 零容忍：任何 serious / critical 都算失败
npm run check:responsive   # 390 / 320 两个宽度；现在还量渲染后的字号（< 9px 判红）
npm run check:layout       # 1440 宽度：一行不超过 52 个汉字；卡片网格不许撑出成片空白
npm run check:motion
```

其它可单独跑的：`check:lab`（每个组件必须真的渲染出来）、`check:examples`、
`check:overview`、`check:bundle`、`check:install`、`check:ssr`、`check:mp`、
`check:flutter`、`check:illustrations`、`check:capability`。

**新加的每条检查都必须带故障注入**：写一个 `scripts/check-*.test.mjs`，
把正确的东西改坏，证明它真的会红。仓库里每条检查都有，别开先例。

**「构建通过」不等于「能用」**：改了界面就用 Playwright 真跑一遍，并把数**量出来**
写进提交信息（例如「刻度字 6px → 12px」「390/320 横向溢出 0」）。

---

## 4. 已知的坑（都踩过，别再踩）

| 坑 | 症状 | 解 |
| --- | --- | --- |
| 浏览器类检查不带 `CHROMIUM_PATH` | `Executable doesn't exist` | `export CHROMIUM_PATH=/opt/pw-browsers/chromium` |
| 加/改组件后没重跑生成脚本 | parity 报「清单过期」 | `build:catalog`、`build:registry`、`build:vue-next`、`build:vue2`、`build:react-index`、`build:styles`、`build:styles:mp` |
| 改了 `src/components` 却用示例站验证 | 改动没生效 | 示例走 `packages/vue-next`，要先 `npm run build:vue-next` |
| Flutter 断言生成器里变量重名 | `Identifier 'x' has already been declared` | `build-golden-test.mjs` 是一个大文件，新块的变量名要加前缀 |
| 中文之间换行 | `check:cjk` 报「多出一个空格」 | `node scripts/check-cjk-wrap.mjs --fix` |
| 新组件没进总览 | `check:overview` 判红 | 归到 `src/data/components.ts` 的分类里，或写进 `PART_OF` 说明它是谁的一部分 |
| React 端没有插槽 | `check:props` 报跨端属性不一致 | 确属框架差异的写进 `scripts/check-props.mjs` 的 `KNOWN` 并说明理由 |
| 一次提交塞两件事 | 提交信息说不全 | 一件事一个提交；信息写**为什么**，带上量出来的数 |

临时脚本放仓库根目录时用 `tmp-*.mjs` 命名（`.gitignore` 已覆盖），跑完删掉；
更好的是放 scratchpad 目录，但那里 import 不到仓库的依赖。

---

## 5. 这一轮做过什么（给上下文，不用复述）

按提交倒序，每条都能 `git show` 看到细节：

- `4a669c7` **G03 转正**：ERP 示例里手写的三页换成了组件——列表加
  `IBulkBar` 并把返回票据交给详情，新建换 `IFormPage`，详情换 `IDetailPage`。
  换的过程逮到两件事：把服务端的 422 规则接到表单的 `valid` 上，会让那条
  分支从界面上永远走不到；顶栏写着「林岚」而实际以「沈野」的身份在操作。
  四条分支都在**真构建产物**上走过一遍，不是 dev server。
- `8391cd4` / `4aa94b5` **B12**：详情页。共享判断在 `logic/detail.ts`——
  状态不允许的动作**不出现**（灰着只会让人反复试），没权限的**出现但停用
  并说明原因**（藏起来会让人以为功能不存在）；三条停用理由的优先级是
  权限 > 失效 > 业务规则；失效时只读动作照常可用；返回票据记着筛选、
  页码与滚动位置。93 条 Dart 对齐断言。
- `4350ed4` / `e1c7ec4` **B07**：批量操作条。共享判断在 `logic/bulk.ts`——
  三种作用域各有一句写死的摘要、「全部匹配」要再确认且**不给 id 名单**
  （名单在服务端，前端硬凑只会凑出当前页）、部分失败只重试失败项、
  多轮重试成功集只增不减。81 条 Dart 对齐断言。
- `aca4629` / `78ea64d` / `64f91da` / `587bfaf` **B09**：表单壳四种形态。
  共享判断在 `logic/formhost.ts`（重复提交闸、离开保护、重置范围、分步状态，
  97 条 Dart 对齐断言），四副躯壳是 `IFormPage`、`IDrawerForm` / `IModalForm`
  （关闭动作本身也要过离开保护）、`IStepForm`（返回上一步不丢数据、
  提交失败跳回出错那一步）。操作条与离开确认抽在 `form-shell.css` 共用一份。
- `9e973b0` **F08**：`IApprovalCard` 的过期与版本失效两条决定路径。
  判定在 `logic/agent.ts` 的 `approvalGate`——即将过期仍可拍板、过期给
  「重新发起」、版本失效给「查看新版本」，两者同时成立以版本失效为准
  （给旧版本的确认续期等于把「内容变了」悄悄抹掉）。
- `eb83ec5` **F06**：新组件 `IRunStatus` 五端，把「排队中」「连接中」
  「连接断开（第几次重连、几秒后重试）」「等待确认」四种静止分开说。
  判定在 `logic/lifecycle.ts`，钉住三条优先级与「这一刻能不能取消」。
- `195c0f3`…`57a9f8b` **版面**：正文行长上限（71 → 45 个汉字一行）、
  Patterns Lab 改多列排版（撑出来的空白 18% → 0），并把两条变成
  `check:layout`（1440 宽度，带故障注入）；规则写进 CLAUDE.md。
- `431cc1a` / `3d3a7e9` **移动端**：图表 viewBox 恒 640 导致手机上刻度字实际只有 6px，
  改成视图宽度跟着容器走（`useChartWidth`，Vue/React 各一份），实测 6px → 12px；
  桑基/矩形树图/甘特/词云改走横向滚动（`i-chart--wide`）；流程图自动缩放下限 0.4 → 0.75；
  页头窄屏各自成行；长说明折三行 + 展开；表格右边缘渐变淡出表示「还能往右拖」。
  并把教训变成检查：`check:responsive` 现在量渲染后的实际字号。
  同一提交里还把总览漏掉的 39 个组件归了类、删掉 3 个重复条目，
  新增 `check:overview` 守住它，新开「布局」与「业务组合」两档。
- `5537fcc` D04 分布图五端（直方/密度/小提琴/误差棒），分箱规则、带宽、误差棒含义印在图下。
- `080fead` B01 `IAppShell` 五端 —— 形态先在示例里跑过一轮再抽成库组件。
- `eac22bb` / `c52de4a` B04+B05 `IProTable` —— 过期响应丢弃、隐藏列与权限分开、固定列上限。
- `879149b` / `3bdec6f` B08 `ISchemaForm` —— schema 里不执行任何字符串，依赖环检测。
- `bede640` G02 门户 + 共用壳 + `check:examples`；G03 ERP 第一切片（422/403/409/幂等四条分支）。
- `b8af6e3` B03 `IQueryFilter` 五端垂直切片 —— pro 层全端的成本标定。
- `b4e602b` pro 层定为全端，并把「某端不支持」变成 `check:capability` 要校验的声明。

G03 已经转正：三页都换成了组件（`4a669c7`）。

---

## 6. 仍然需要你（用户）手动做的事

这几件在仓库里做不了，需要在 GitHub 上操作：

1. **Pages Source** 设为 `gh-pages / (root)`（`deploy.yml` 已经在推 `gh-pages` 分支）。
2. 删掉远端的 **`feat/astra_redesign`** 分支（已作废）。
3. 建 **`npm-publish`** 环境并配 **`NPM_TOKEN`** secret —— `release.yml` 等着它；
   在此之前不要宣称「可发布」（对应计划里的 H06）。

---

## 7. 新会话的开场建议

```text
读 docs/HANDOVER.md 与 docs/astra.md 第 10 节，然后按「下一步的顺序」继续。
分支 claude/eloquent-shannon-amg4k8，一件事一个提交，
每条新检查都要有故障注入，改了界面用 Playwright 量出来再写进提交信息。
```
