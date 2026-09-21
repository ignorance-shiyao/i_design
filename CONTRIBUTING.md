# 参与开发

先读根目录的 `CLAUDE.md`——那是这个仓库的硬性规则，
违反其中任何一条都算缺陷，**即使构建通过、测试全绿**。
其中几条反直觉（不用加粗边线表达状态、元素填充不用渐变、实心色块上的字要成对取、
图标不用 emoji），动手前一定读完。

## 环境

```bash
npm ci          # 必须用 ci：.npmrc 的 legacy-peer-deps 让 Vue 2.7 与 Vue 3 共存，不能删
npm run dev     # 文档站，hash 路由
```

浏览器相关的检查需要一个 Chromium。CI 里用 `npx playwright install --with-deps chromium`；
本地已经有的话，用 `CHROMIUM_PATH=/path/to/chromium` 指过去。

## 合入门槛

一条都不能少，也不许放宽阈值：

```bash
npm run check:parity      # 跨端一致、生成物新鲜度、能力注册表、许可与来源、样式禁令……
npm run typecheck
npm test
npm run build
npm run build:packages    # 顺带核对各包的 main / module / types / exports
npm run check:a11y        # 零容忍：任何 serious / critical 都失败
npm run check:responsive  # 390 / 320 两个宽度，整页能左右拖就失败
npm run check:layout      # 1440 宽度：正文行长与卡片网格撑出来的空白
npm run check:motion      # 系统的减少动效与面板开关都要真的把动效关掉
npm run check:install     # 把包装进仓库外的干净项目里真跑一遍（慢，但只有它能证明别人装得上）
npm run check:ssr         # 无 DOM 的 Node 里 import、Vue/React 服务端渲染、hydrate 与 CSP
npm run check:bundle      # 按需引入的隔离与体积回归（要先 build:packages）
npm run check:lab         # Patterns Lab 里每个组件都真的渲染出来（要先 build）
```

**别用管道跑这些检查**：`npm run check:a11y | tail` 的退出码来自 `tail`，
失败会被吞掉。这个仓库里有一条 nested-interactive 差点因此漏过去。

## 图标

图标本体在 `packages/common/src/icons/index.ts`，元数据（中文名、语义域、
业务别名）在同目录的 `meta.ts`，单图标导出由脚本生成。新增一个图标要同时补
元数据，否则它在检索里等于不存在——`npm run check:icons` 会报出来，
形状与既有图标重复、别名被别的图标占用也会。

## 生成物

「清单类」文件一律按目录生成：导出清单、覆盖矩阵、能力注册表、属性表、
小程序四件套、Flutter barrel、各包许可证。哪些文件是生成的，
看 `package.json` 里 `build:*` 那几条各自写到哪儿。

生成物是提交进仓库的，CI 会在跑完检查后比对工作区是否干净——
改了源码没跑生成脚本的话，这一步会红。**不要手改生成物**：
下一次生成会把你的改动冲掉，而且冲掉不会让任何检查失败。

## 新增组件

组件要各端齐备（Vue 3 / Vue 2 / React / 小程序 / Flutter），并且：

- 只引用语义令牌（`var(--i-color-*)` / `var(--i-radius-*)`），不写死色值与尺寸；
- 小程序目录名必须是组件名的 kebab 形式（`IFineTuneCard` → `fine-tune-card`），
  写成 `finetune-card` 会被覆盖矩阵判成这一端缺失，而且不报错；
- 文档站里要有可运行的演示，`npm run check:registry` 会把只有源码没有演示的组件报出来；
  组件会自动出现在 Patterns Lab（`/design/lab`）里，必填属性是数组或对象的，
  要在 `src/data/labFixtures.ts` 补一份最小数据，否则 `check:lab` 会报「只有名字不算覆盖」；
- 各端都要从包入口导出——有源码但没导出，覆盖矩阵照样是绿的，而使用方 import 不到。

## 新加检查

必须做**故障注入**：故意弄坏一处，确认它真的会红，并把那个坏例子写成测试。
这个仓库里出现过「检查加了但永远不会失败」。

有明确例外的禁令，正例同样要写进测试：误报会逼着人把检查关掉，
那比没有检查更糟（例如样式禁令要放行几何三角形、纹理与氛围底、
取色器里「渐变本身就是数据」的色面）。

## 改了界面

用 Playwright 真跑一遍并**量**出来：改尺寸就量高度，改动效就量过渡中的位置，
不是只截图。已经有过多次「代码看着对、量一下差 4px」。

## 发布

版本、弃用与兼容策略见 [VERSIONING.md](VERSIONING.md)：各端的包同版本号一起发，
包与包之间写死版本而不是范围，弃用必须写明在哪个版本移除。

```bash
npm run release            # dry-run：看会发出去哪些文件
```

真发只从 CI 的 Release 流程手动触发，`NPM_TOKEN` 只在那里。
本地跑 `release.mjs --yes` 在没有 NPM_TOKEN 时会直接拒绝。

## 提交与 PR

- 一个 PR 只解决一件事。几项混在一起时，一项不合格整个 PR 都得退回。
- 提交信息写**为什么这么改**，而不是复述改了哪几个文件。
- 一次性脚本别提交：`.gitignore` 挡了 `*.tmp.mjs` 与 `tmp-*.mjs`。

## 现在验证到了哪一步

说清楚哪些是真的验过的，比声称支持更重要：

| 范围 | 验证方式 | 结论 |
| --- | --- | --- |
| Vue 3 / Vue 2.7 / React / 移动端（Vue 3） | `check:install`：tarball 装进仓库外的干净项目，过类型、打包、浏览器渲染与样式 | 已验证 |
| 各端源码与导出的一致性 | `check:parity`、`check:registry` | 已验证 |
| 无障碍、窄屏、减少动效 | 真浏览器逐页扫描 | 已验证（文档站范围内） |
| 服务端渲染 | `check:ssr`：无 DOM 的 Node 里 import 各包产物、Vue 3 与 React 渲染、浏览器里 hydrate 并检查不匹配告警 | 已验证 |
| 严格 CSP（`style-src 'self'`，不带 unsafe-inline） | `check:ssr` 分两档测 | **只有不依赖动态几何的组件可用**，见下 |
| 小程序 | 四件套齐全性与目录校验，**没有在真机或开发者工具里跑过** | 未验证运行时 |
| Flutter | barrel、golden 测试脚本齐全性，**没有在模拟器或真机上跑过** | 未验证运行时 |
| 按需引入 | `check:bundle`：打包实测，只引一个按钮的产物不含流程画布/图表/三维，且体积不超预算 | 已验证 |
| npm registry 发布 | 流程与 dry-run 已就绪（`npm run release`），**尚未真正发布过任何版本** | 未发布 |

关于 CSP：图表按数据定形状、图标按 px 定尺寸，这些只能写成内联 style 属性，
而不带 `unsafe-inline` 的 `style-src` 会把整个 style 属性拒掉——症状是图形塌成 0，
控制台有告警但页面照常显示，肉眼看不出来。所以现在的口径是：
静态组件在严格 CSP 下完好（`check:ssr` 的第一档就在测这个），
用到动态几何的组件需要使用方放开 `style-src 'unsafe-inline'`。
图标的默认尺寸已经从内联样式挪进了 `.i-icon` 类——它是全库出现最多的元素。

「源码齐备」不等于「生产可用」。上表里写着「未验证运行时」的两端，
在补上真机验证之前，不要在任何文档里写成已支持。
