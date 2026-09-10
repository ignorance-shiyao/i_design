/**
 * 输入标签的成词规则。
 *
 * 「什么时候把这段文字变成一个标签」看着简单，实际有一串边界：
 * 空白要不要成标签、粘贴一段带逗号的文本怎么拆、退格什么时候删末项。
 * 各端各写一遍，同一个输入框在两端上粘贴同一段文字会得到不同数量的标签。
 */

export interface TagInputOptions {
  /** 允许重复。默认不允许——重复的标签在任何筛选场景里都是噪声 */
  allowDuplicate?: boolean
  /** 最多几个 */
  max?: number
  /** 除回车外，哪些字符也触发成词 */
  separators?: string[]
}

export const DEFAULT_SEPARATORS = [',', '，', ';', '；', '\n', '\t']

/**
 * 把一段文本拆成若干标签。
 *
 * 粘贴场景才是这里的主用途：用户从表格里复制一列邮箱过来，
 * 拿到的是一段带换行和逗号的文本，逐个手敲显然不是设计意图。
 * 全角逗号与分号也算分隔符——中文输入法下打出来的就是全角。
 */
export function splitTags(text: string, separators: string[] = DEFAULT_SEPARATORS): string[] {
  if (!text) return []
  const pattern = new RegExp(`[${separators.map(escapeForClass).join('')}]`)
  return text
    .split(pattern)
    .map((part) => part.trim())
    .filter(Boolean)
}

function escapeForClass(char: string): string {
  return char.replace(/[\\\]^-]/g, '\\$&')
}

export interface AddResult {
  tags: string[]
  /** 没加进去的原因，用来给出提示；空表示都加成功了 */
  rejected: 'duplicate' | 'max' | 'empty' | null
}

/**
 * 往已有标签里加一批。
 *
 * 返回被拒绝的原因而不是静默丢弃：用户粘贴了十个邮箱只进去七个，
 * 不给理由的话他会以为组件坏了，而最常见的原因（重复、超上限）恰恰是可以说清的。
 */
export function addTags(
  current: string[],
  incoming: string[],
  { allowDuplicate = false, max = 0 }: TagInputOptions = {}
): AddResult {
  const next = [...current]
  let rejected: AddResult['rejected'] = null

  for (const raw of incoming) {
    const tag = raw.trim()
    if (!tag) {
      rejected = rejected ?? 'empty'
      continue
    }
    if (!allowDuplicate && next.includes(tag)) {
      rejected = 'duplicate'
      continue
    }
    if (max > 0 && next.length >= max) {
      rejected = 'max'
      break
    }
    next.push(tag)
  }

  return { tags: next, rejected }
}

/**
 * 退格键该做什么。
 *
 * 只有输入框为空时才删末项，且要删的是「整个标签」而不是它的最后一个字符——
 * 有内容时删字符是所有输入框的通用行为，破坏它会让人不敢用退格。
 */
export function backspace(current: string[], draft: string): { tags: string[]; consumed: boolean } {
  if (draft.length > 0 || current.length === 0) return { tags: current, consumed: false }
  return { tags: current.slice(0, -1), consumed: true }
}

/** 删掉指定位置的标签 */
export function removeTag(current: string[], index: number): string[] {
  return current.filter((_, i) => i !== index)
}

/**
 * 输入过程中是否触发了分隔符。
 *
 * 返回「要成词的部分」和「留在输入框里的部分」：
 * 用户可能一次粘贴进来 "a,b,c"，前两个成标签，"c" 应当留着继续编辑，
 * 而不是连它一起变成标签——那样再补字就得先把标签删掉。
 */
export function splitDraft(
  draft: string,
  separators: string[] = DEFAULT_SEPARATORS
): { ready: string[]; rest: string } {
  const hit = separators.some((s) => draft.includes(s))
  if (!hit) return { ready: [], rest: draft }
  const pattern = new RegExp(`[${separators.map(escapeForClass).join('')}]`)
  const parts = draft.split(pattern)
  const rest = parts.pop() ?? ''
  return { ready: parts.map((p) => p.trim()).filter(Boolean), rest }
}
