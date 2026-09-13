/**
 * 统一 diff 视图的行比对。
 *
 * 代码块要能显示「这次改了什么」——智能体给出的补丁、评审里的对照，
 * 都需要同一件事：哪几行加了、哪几行删了、其余照旧。
 *
 * 放公共层不是为了省代码量，是因为**各端必须给出同一份结果**：
 * 同一个补丁在 Web 上显示改了 3 行、在 Flutter 上显示改了 5 行，
 * 读者会不知道该信哪个。
 */

export type DiffKind = 'same' | 'add' | 'remove'

export interface DiffLine {
  kind: DiffKind
  text: string
  /** 在旧文本里的行号（1 起）；新增行没有 */
  before?: number
  /** 在新文本里的行号（1 起）；删除行没有 */
  after?: number
}

/**
 * 最长公共子序列的长度表。
 *
 * 用 LCS 而不是逐行对齐：逐行比对在开头插入一行时会把后面**所有**行都标成改动，
 * 而实际只加了一行。那样的 diff 读者根本没法用。
 *
 * 表是 O(n×m) 的。代码块不是版本控制系统，几百行的量级完全够用；
 * 真要比一万行的文件，该用的是专门的 diff 工具，不是一个组件。
 */
function lcsTable(a: string[], b: string[]): number[][] {
  const table: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0))
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      table[i][j] = a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1])
    }
  }
  return table
}

/**
 * 把两段文本比成一串带标记的行。
 *
 * 同一处改动里，删除排在新增之前——读者的视线顺序是「原来是什么 → 变成了什么」，
 * 反过来排会读成「变成了什么 → 原来是什么」，每一处都要在脑子里倒一次。
 */
export function diffLines(before: string, after: string): DiffLine[] {
  const a = before.split('\n')
  const b = after.split('\n')
  const table = lcsTable(a, b)

  const out: DiffLine[] = []
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      out.push({ kind: 'same', text: a[i], before: i + 1, after: j + 1 })
      i++
      j++
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      out.push({ kind: 'remove', text: a[i], before: i + 1 })
      i++
    } else {
      out.push({ kind: 'add', text: b[j], after: j + 1 })
      j++
    }
  }
  while (i < a.length) out.push({ kind: 'remove', text: a[i], before: ++i })
  while (j < b.length) out.push({ kind: 'add', text: b[j], after: ++j })
  return out
}

/** 改动统计，用于「+13 −4」这类摘要 */
export function diffStat(lines: DiffLine[]): { added: number; removed: number } {
  return {
    added: lines.filter((l) => l.kind === 'add').length,
    removed: lines.filter((l) => l.kind === 'remove').length
  }
}
