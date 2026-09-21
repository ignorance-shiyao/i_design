# E02 节点注册表（第一刀：common 口径）

## 口径

写在 `packages/common/src/logic/noderegistry.ts`：

1. **属性由 schema 驱动**——节点类型声明 `FormSchema`，检查器直接喂给 SchemaForm；画布核心不写 `if (type === …)`。
2. **加一种业务节点 = 往注册表塞一条定义**，不许改 `IFlow` / `flow.ts`。
3. **删除同步边与分组成员**——悬空边与幽灵成员是以后最难查的脏数据。
4. **未知类型只读占位**——沿用 E01 的 `unknownNodes`；没有 schema，不假装可编辑。

`GraphDocument` 是持久化真相；`FlowNode` / `FlowEdge` 是投影。

## 证据

- 7 条 vitest：创建/插入、删除同步边与分组、未知类型只读、扩展注册表、Flow 投影。
- 分支：`cursor/e02-node-registry-c2d1`。

## 文档页演示（第二刀）

`FlowPage` 增加「节点工具箱与属性检查器」：

- 工具箱 = `registry.list()`，插入走 `createNode` + `insertNode`
- 画布只吃 `toFlowNodes` / `toFlowEdges` 投影
- 属性检查器 = `resolvePropertySchema` → `ISchemaForm`；未知类型只读占位
- 删除走 `deleteNodes`（边与分组成员同步）

## 验证证据

2026-09-21 实测（Playwright，`CHROMIUM_PATH` 指向缓存 Chromium）：

| 页面 | 视口 | 横向溢出 | 工具箱按钮 | 画布节点 |
| --- | --- | --- | --- | --- |
| 流程图 / 节点编辑器 | 1440 / 390 / 320 | 0 / 0 / 0 | 5 / 5 / 5 | 3 / 3 / 3 |

亮暗两态 axe serious/critical = 0；`check:nodes` 已接 CI。

浏览器故障注入 8 次，每次确认对应用例报红：

- 删除不清相连边、未知类型给出可编辑表单、投影不吃 canvasShape、
  注册表标签改名、schema 字段改名、改属性不同步标签、
  工具箱少列类型、插入结果没落到文档上。

Vite 把 TS/SFC 编成 JS 后再交给浏览器，故障串必须命中编译后的双引号形态。

顺带修掉一个真缺陷：SchemaForm 的开关字段没有可访问名（`<label for>` 落不到
`role="switch"` 的按钮上），读屏只会念「开关，未选中」。各端都补了名字——
Web 用 `aria-label`，小程序用 `aria-label`，Flutter 用 `Semantics`。

## 还没做

- 各端独立工具箱 / 检查器组件（若需要拆出页面级组合）
- 端口连线编辑（E03）
