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

## 还没做（下一刀）

- 工具箱 + 属性检查器接到 Flow 文档页
- 五端组件（若拆成独立组件）
- `check:nodes` 浏览器闭环与故障注入
