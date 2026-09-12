/**
 * 命令搜索的匹配与排序。
 *
 * 搜索这件事的成败全在排序：把「按钮」输进去，第一条必须是 Button 而不是
 * 「按钮组」或者某个说明里恰好带这两个字的条目。排错一次，用户下次就不用搜索了，
 * 转回去用鼠标翻菜单——而那正是搜索本该省掉的事。
 *
 * 放公共层是因为各端都要搜同一份东西：站点搜文档页，应用里搜命令、搜设置项。
 * 排序规则各写一遍的话，同一个词在两处给出的第一条会不一样。
 */

export interface CommandItem {
  /** 稳定标识，用于选中回调 */
  key: string
  /** 主标题，排序时权重最高 */
  label: string
  /** 副标题或路径，次一级 */
  description?: string
  /** 额外可搜的词：英文名、别名、缩写 */
  keywords?: string[]
  /** 分组名，用于结果里的小标题 */
  group?: string
}

export interface CommandMatch {
  item: CommandItem
  score: number
  /** 命中区间（在 label 上的下标），用于高亮 */
  ranges: [number, number][]
}

/**
 * 一个词在一段文本里的命中位置与得分。
 *
 * 三档，差距拉得很开：整串相等 > 从头开始 > 出现在中间。
 * 差距小了，排序就会被「描述里也提到这个词」这类弱命中顶上来。
 */
function scoreText(text: string, query: string): { score: number; at: number } | null {
  const lower = text.toLowerCase()
  const at = lower.indexOf(query)
  if (at < 0) return null
  if (lower === query) return { score: 100, at }
  if (at === 0) return { score: 80, at }
  /*
   * 词首命中（「表单 校验」里搜「校验」）比词中命中（「校验」里搜「验」）有用得多。
   * 中文没有空格，因此把常见分隔符与非字母数字都算作词的起点。
   */
  const prev = lower[at - 1]
  if (prev && /[\s\-_/·、，,.（(]/.test(prev)) return { score: 60, at }
  return { score: 40, at }
}

/** 字段权重：标题 > 关键词 > 描述。描述里命中只当作补充证据，不足以顶到前面 */
const FIELD_WEIGHT = { label: 1, keywords: 0.7, description: 0.4 }

/**
 * 过滤并排序。
 *
 * 空查询返回原序的全部条目——搜索框刚打开时该看到「有哪些东西可搜」，
 * 而不是一片空白等着用户猜。
 */
export function searchCommands(items: CommandItem[], query: string, limit = 20): CommandMatch[] {
  const q = query.trim().toLowerCase()
  if (!q) return items.slice(0, limit).map((item) => ({ item, score: 0, ranges: [] }))

  const out: CommandMatch[] = []
  for (const item of items) {
    const inLabel = scoreText(item.label, q)
    const inKeywords = (item.keywords ?? [])
      .map((k) => scoreText(k, q))
      .filter(Boolean)
      .sort((a, b) => b!.score - a!.score)[0]
    const inDesc = item.description ? scoreText(item.description, q) : null

    const score = Math.max(
      (inLabel?.score ?? 0) * FIELD_WEIGHT.label,
      (inKeywords?.score ?? 0) * FIELD_WEIGHT.keywords,
      (inDesc?.score ?? 0) * FIELD_WEIGHT.description
    )
    if (!score) continue
    out.push({
      item,
      score,
      // 只高亮标题上的命中：把描述也标起来会让整行斑斑点点，反而看不出重点
      ranges: inLabel ? [[inLabel.at, inLabel.at + q.length]] : []
    })
  }

  /*
   * 同分时按标题长度排。
   *
   * 搜「按钮」时「按钮」与「按钮组」都是 80 分，短的那个几乎总是用户想要的——
   * 它是这个词本身，而不是以它开头的另一件东西。
   */
  return out
    .sort((a, b) => b.score - a.score || a.item.label.length - b.item.label.length)
    .slice(0, limit)
}

/**
 * 上下键在结果里移动。
 *
 * 到头要绕回去：一串结果里按到底之后再按一下，回到第一条比停在最后一条有用——
 * 停住的话用户会以为键盘失灵，然后去够鼠标。
 */
export function moveCommandIndex(current: number, delta: number, total: number): number {
  if (total <= 0) return 0
  return (current + delta + total) % total
}
