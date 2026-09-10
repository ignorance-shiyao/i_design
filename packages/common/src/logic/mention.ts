/**
 * 提及（@ 与 /）的触发与插入。
 *
 * 「什么时候该弹候选、弹的是哪一段」看着简单，实际有一串边界：
 * 邮箱里的 @ 不该弹、词中间的 @ 不该弹、已经打了空格就该收起。
 * 各端各写一遍，同一段输入在两端上一个弹一个不弹。
 */

export interface MentionTrigger {
  /** 触发符在文本中的下标 */
  at: number
  /** 触发符本身，通常是 @ 或 / */
  symbol: string
  /** 触发符之后已经输入的查询串 */
  query: string
}

/**
 * 光标前是否正处在一次提及里。不在则返回 null。
 *
 * 三条判定，缺一条都会让它在不该弹的时候弹出来：
 *
 * 1. 触发符前面必须是行首或空白。`user@example.com` 里的 @ 前面是字母，
 *    不该弹——用户在打邮箱，弹出来的候选会把回车键抢走。
 * 2. 触发符与光标之间不能有空白。打完 `@张三 然后` 之后候选就该收起，
 *    否则用户往下写正文时，回车会被候选面板吃掉。
 * 3. 查询串有长度上限。没有上限的话，一个没选中任何人的 @ 会让整段话
 *    都被当成查询，候选列表永远是空的，而面板一直挂在那里。
 */
export function findMention(
  text: string,
  caret: number,
  symbols: string[] = ['@'],
  maxQuery = 24
): MentionTrigger | null {
  const before = text.slice(0, caret)

  for (let i = before.length - 1; i >= 0 && before.length - i <= maxQuery + 1; i--) {
    const char = before[i]
    if (/\s/.test(char)) return null
    if (!symbols.includes(char)) continue

    const prev = i === 0 ? '' : before[i - 1]
    // 前面必须是行首或空白，否则是邮箱、路径这类本来就带符号的文本
    if (prev !== '' && !/\s/.test(prev)) return null
    return { at: i, symbol: char, query: before.slice(i + 1) }
  }
  return null
}

/**
 * 选中一个候选后，把触发段替换成完整的提及。
 *
 * 末尾补一个空格：不补的话，光标紧贴着刚插入的名字，
 * 用户接着打字会立刻又触发一次候选——因为光标前正好还是那段提及。
 */
export function applyMention(
  text: string,
  trigger: MentionTrigger,
  label: string,
  caret: number
): { text: string; caret: number } {
  const inserted = `${trigger.symbol}${label} `
  const next = text.slice(0, trigger.at) + inserted + text.slice(caret)
  return { text: next, caret: trigger.at + inserted.length }
}

/** 按查询串过滤候选。空查询给全量——刚打出 @ 时应当先看到有哪些人 */
export function filterMentions<T extends { label: string; keywords?: string[] }>(
  options: T[],
  query: string
): T[] {
  if (!query) return options
  const needle = query.toLowerCase()
  return options.filter(
    (option) =>
      option.label.toLowerCase().includes(needle) ||
      (option.keywords ?? []).some((k) => k.toLowerCase().includes(needle))
  )
}
