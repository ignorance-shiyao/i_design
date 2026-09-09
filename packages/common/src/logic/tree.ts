/**
 * 树的选择与展开逻辑：与框架无关的纯函数。
 *
 * 树是本体系里状态最容易算错的结构——展开态、选中态、半选态三者互相牵连，
 * 再叠加禁用节点与搜索过滤。任何一端自己实现一遍，都会在某个分支上和别人不一样，
 * 而这类偏差在界面上表现为「勾了父节点，某个子节点没跟着变」，很难复现。
 *
 * 因此这里把树先拍平成 key → 实体的索引表，之后所有判断都基于它，
 * 不再递归遍历原始嵌套结构：递归版本在深树上既慢又难保证顺序一致。
 */

export interface TreeNode {
  key: string
  label: string
  children?: TreeNode[]
  disabled?: boolean
}

export interface TreeEntity {
  key: string
  node: TreeNode
  /** 根节点为 undefined */
  parentKey?: string
  /** 根为 0 */
  level: number
  childKeys: string[]
  disabled: boolean
}

export type TreeEntities = Map<string, TreeEntity>

/** 把嵌套结构拍平成索引表，顺序为深度优先前序（与渲染顺序一致） */
export function flattenTree(nodes: TreeNode[]): TreeEntities {
  const entities: TreeEntities = new Map()
  const walk = (list: TreeNode[], parentKey: string | undefined, level: number) => {
    for (const node of list) {
      const childKeys = (node.children ?? []).map((child) => child.key)
      entities.set(node.key, {
        key: node.key,
        node,
        parentKey,
        level,
        childKeys,
        // 禁用向下继承：父节点禁用时，子节点不该还能被单独勾选
        disabled: !!node.disabled || !!(parentKey && entities.get(parentKey)?.disabled)
      })
      if (node.children?.length) walk(node.children, node.key, level + 1)
    }
  }
  walk(nodes, undefined, 0)
  return entities
}

/** 某个节点的全部后代 key */
export function descendantKeys(entities: TreeEntities, key: string): string[] {
  const out: string[] = []
  const stack = [...(entities.get(key)?.childKeys ?? [])]
  while (stack.length) {
    const current = stack.pop()!
    out.push(current)
    stack.push(...(entities.get(current)?.childKeys ?? []))
  }
  return out
}

/** 某个节点的全部祖先 key，由近及远 */
export function ancestorKeys(entities: TreeEntities, key: string): string[] {
  const out: string[] = []
  let parent = entities.get(key)?.parentKey
  while (parent) {
    out.push(parent)
    parent = entities.get(parent)?.parentKey
  }
  return out
}

export interface VisibleRow {
  key: string
  node: TreeNode
  level: number
  hasChildren: boolean
  expanded: boolean
  disabled: boolean
}

/**
 * 当前应该渲染出来的行。
 * 只有展开路径上的节点才出现，因此折叠一个大分支的代价是 O(被跳过的节点数)。
 */
export function visibleRows(
  nodes: TreeNode[],
  entities: TreeEntities,
  expandedKeys: Iterable<string>,
  /** 传入时只保留命中的节点及其祖先 */
  visibleKeys?: Set<string>
): VisibleRow[] {
  const expanded = new Set(expandedKeys)
  const rows: VisibleRow[] = []
  const walk = (list: TreeNode[]) => {
    for (const node of list) {
      if (visibleKeys && !visibleKeys.has(node.key)) continue
      const entity = entities.get(node.key)
      if (!entity) continue
      const hasChildren = !!node.children?.length
      const isExpanded = expanded.has(node.key)
      rows.push({
        key: node.key,
        node,
        level: entity.level,
        hasChildren,
        expanded: isExpanded,
        disabled: entity.disabled
      })
      if (hasChildren && isExpanded) walk(node.children!)
    }
  }
  walk(nodes)
  return rows
}

export interface CheckState {
  checked: Set<string>
  /** 部分子节点被选中的父节点：复选框要显示为半选，而不是选中 */
  halfChecked: Set<string>
}

/**
 * 由一组选中的 key 推导出完整的选中态与半选态。
 *
 * 自底向上按层级推：先把每个选中节点的后代补全，再逐层判断父节点——
 * 子节点全选则父节点选中，部分选中则父节点半选。
 * 禁用节点不参与「全选」的判定，否则一个禁用的子节点会永远拖住父节点，
 * 让用户怎么点父节点都变不成选中。
 */
export function resolveCheckState(entities: TreeEntities, keys: Iterable<string>): CheckState {
  const checked = new Set<string>()
  for (const key of keys) {
    if (!entities.has(key)) continue
    checked.add(key)
    for (const child of descendantKeys(entities, key)) {
      if (!entities.get(child)?.disabled) checked.add(child)
    }
  }

  const halfChecked = new Set<string>()
  // 按层级从深到浅处理，保证判断父节点时它的子节点已经算完
  const byLevel = [...entities.values()].sort((a, b) => b.level - a.level)
  for (const entity of byLevel) {
    if (!entity.childKeys.length) continue
    const selectable = entity.childKeys.filter((k) => !entities.get(k)?.disabled)
    if (!selectable.length) continue
    const all = selectable.every((k) => checked.has(k))
    const some = selectable.some((k) => checked.has(k) || halfChecked.has(k))
    if (all) checked.add(entity.key)
    else {
      checked.delete(entity.key)
      if (some) halfChecked.add(entity.key)
    }
  }
  return { checked, halfChecked }
}

/**
 * 勾选或取消一个节点后的新选中集合。
 * 返回的是「用户视角的选中项」，再交给 resolveCheckState 推导半选。
 */
export function toggleChecked(
  entities: TreeEntities,
  currentChecked: Iterable<string>,
  key: string,
  next: boolean
): Set<string> {
  const entity = entities.get(key)
  const checked = new Set(currentChecked)
  if (!entity || entity.disabled) return checked

  const affected = [key, ...descendantKeys(entities, key)]
  for (const target of affected) {
    if (entities.get(target)?.disabled) continue
    if (next) checked.add(target)
    else checked.delete(target)
  }
  // 祖先由 resolveCheckState 重新推导，这里先摘掉：
  // 取消一个孙节点后，祖先不该还留在集合里
  for (const parent of ancestorKeys(entities, key)) checked.delete(parent)
  return checked
}

/** 只保留叶子节点的选中值，便于提交给后端（父节点通常只是分组） */
export function leafKeys(entities: TreeEntities, checked: Iterable<string>): string[] {
  return [...checked].filter((key) => !entities.get(key)?.childKeys.length)
}

export interface SearchResult {
  /** 命中的节点及其祖先，用于过滤渲染 */
  visible: Set<string>
  /** 命中节点的祖先，用于自动展开 */
  expand: Set<string>
  /** 命中本身，用于高亮 */
  matched: Set<string>
}

/**
 * 按关键字过滤。
 *
 * 命中节点的祖先必须一并保留——否则命中项因为父节点被过滤掉而无处挂载，
 * 结果是「搜得到却看不见」。祖先同时进入展开集合，用户不必再手动逐层点开。
 */
export function searchTree(entities: TreeEntities, keyword: string): SearchResult {
  const matched = new Set<string>()
  const visible = new Set<string>()
  const expand = new Set<string>()
  const needle = keyword.trim().toLowerCase()
  if (!needle) return { visible, expand, matched }

  for (const entity of entities.values()) {
    if (!entity.node.label.toLowerCase().includes(needle)) continue
    matched.add(entity.key)
    visible.add(entity.key)
    for (const parent of ancestorKeys(entities, entity.key)) {
      visible.add(parent)
      expand.add(parent)
    }
    // 命中节点的后代一并显示：用户搜到一个分组，通常是想看它下面有什么
    for (const child of descendantKeys(entities, entity.key)) visible.add(child)
  }
  return { visible, expand, matched }
}
