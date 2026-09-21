# D08 邻接矩阵

本次关闭 D08。示例页：`/#/components/adjacency`。
开发分支 `cursor/d08-adjacency-matrix-c2d1`。

## 空格不是 0，排序口径写死

`packages/common/src/logic/adjacency.ts` 的 `buildAdjacency` 是唯一入口。
这张图回答「谁连着谁、连得有多重」。和留存、断流一样，最危险的不是算错，
而是把「没有数据」画成「数据是 0」。三条口径：

- **空格分两种，都不是 0。** `absent` = 确认没有边；`unknown` = 没统计到。
  两者 value 都是 null，画成「—」。真正的零权边是 `ready` 且值为 0。
- **排序必须显式选择。** `input` / `degree` / `community`，写在模型的 `basis`
  上并画在图上。不允许各端私自猜默认序。
- **有向 / 无向写死。** 无向图 (i,j)=(j,i)；有向图不镜像。对角线默认无边，
  除非显式自环。

状态芯片用 subtle + text 令牌；色阶五档只涂 ready，空档不涂最浅档——
否则看起来像「权重接近 0」。

## 验证证据

2026-09-21 实测（Playwright，`CHROMIUM_PATH` 指向缓存 Chromium）：

| 页面 | 视口 | 横向溢出 | 关键量 | 正文最长 |
| --- | --- | --- | --- | --- |
| 邻接矩阵 | 1440 / 390 / 320 | 0 / 0 / 0 | 16 格；无边与未观测画「—」；零权边画 0 | 45 / 24.43 / 17em |

亮暗两态 axe serious/critical = 0。有向示例中甲→乙有值、乙→甲保持空档。

合并前在 main 上实测为 EXIT:0 的门禁：`typecheck` / `test` / `build` /
`check:parity` / `check:adjacency` / `check:a11y`（162 页亮暗）/ `check:responsive` /
`check:layout` / `check:motion`。

这不是全仓门禁。同一时点 `check:bundle` 与 `check:nodes` 都是红的：前者因为
`logic/noderegistry.ts` 的顶层调用让内置节点表摇不掉，后者因为 E03 在同一页
加了第二个「重置示例」按钮撞坏了 E02 的定位。两条都已在 main 上修掉——
记在这里是因为「跑过的那几条绿」和「全仓绿」差着的正是这两条。

单测：`adjacency.test.ts` 10 条。浏览器故障注入 8 次，每次确认对应用例报红：

- 无边空档画成 0、未观测空档画成 0、口径说明被改、有向图被镜像、
  社群排序口径被改、键盘选择不更新、正文行长超 45em、页面横向溢出。

Vite 把 TS/SFC 编成 JS 后再交给浏览器，故障串必须命中编译后的双引号形态。

小程序与 Flutter 仅通过仓库静态检查，没有 SDK/真机运行证据，不标 runtime-verified。
