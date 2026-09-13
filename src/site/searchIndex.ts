import type { CommandItem } from '@i-design/common'
import { componentCategories } from '@/data/components'
import { docNav } from '@/data/nav'

/**
 * 站内搜索的条目表。
 *
 * 从既有的两份数据拼出来，而不是另手写一份清单：手写的那份迟早会漏掉新页面，
 * 而漏掉不会让构建失败——读者只会以为「这个库没有这个组件」。
 *
 * 组件走 componentCategories（有中英文名、说明与分组），
 * 设计与资源这类页面走左侧导航——它们本来就都在那里。
 */
export function buildSearchIndex(): CommandItem[] {
  const items: CommandItem[] = []
  const seen = new Set<string>()

  for (const category of componentCategories) {
    for (const item of category.items) {
      if (item.status !== 'ready') continue
      seen.add(item.to)
      items.push({
        key: item.to,
        // 中英文都放进标题：有人记得 Empty，有人记得「空状态」
        label: `${item.name} ${item.cn}`,
        description: item.desc,
        keywords: [item.name, item.cn],
        group: category.title
      })
    }
  }

  for (const group of docNav) {
    for (const link of group.items) {
      if (seen.has(link.to)) continue
      seen.add(link.to)
      items.push({ key: link.to, label: link.label, group: group.title })
    }
  }

  return items
}
