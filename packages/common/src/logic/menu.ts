/**
 * 导航菜单的展开与选中。
 *
 * 复用 logic/tree 的拍平索引：菜单本质就是一棵树，
 * 差别只在「选中的是叶子，展开的是路径」这条约定。
 */
import { ancestorKeys, flattenTree, type TreeEntities, type TreeNode } from './tree'

export type MenuMode = 'vertical' | 'horizontal'

export interface MenuItem extends TreeNode {
  icon?: string
  children?: MenuItem[]
}

/**
 * 选中某一项时应当展开的分组。
 *
 * 直接把新 key 追加进 openKeys 是不够的——从外部（比如路由跳转）切到另一个分支时，
 * 那个分支的祖先没被展开，用户会看到选中项藏在收起的分组里。
 */
export function openKeysFor(entities: TreeEntities, selectedKey: string, current: Iterable<string>): string[] {
  const next = new Set(current)
  for (const key of ancestorKeys(entities, selectedKey)) next.add(key)
  return [...next]
}

/** 手风琴模式：展开一个分组时收起同层的其它分组 */
export function accordionOpenKeys(
  entities: TreeEntities,
  openKeys: Iterable<string>,
  key: string
): string[] {
  const open = new Set(openKeys)
  if (open.has(key)) {
    open.delete(key)
    return [...open]
  }
  const level = entities.get(key)?.level
  // 同层的其它分组收起；祖先必须留着，否则整条路径会一起塌掉
  const path = new Set([...ancestorKeys(entities, key), key])
  for (const other of [...open]) {
    if (entities.get(other)?.level === level && !path.has(other)) open.delete(other)
  }
  open.add(key)
  return [...open]
}

/** 由菜单数据建索引，供上面两个函数使用 */
export const menuEntities = (items: MenuItem[]) => flattenTree(items)
