/**
 * 选区操作的纯逻辑。
 *
 * 选中一段文字，就地弹出一排动作（改写、缩短、解释……），把这段话交给智能体。
 * 三件事必须落在公共层：
 *
 * - **什么样的选区才值得弹出这排按钮**。空选、只选中一个空格、跨越半篇文章，
 *   各端各定一个门槛的话，同一次拖选在一端弹出、在另一端不弹。
 * - **选区文本怎么清理**。交给智能体之前要去掉软换行与多余空白，
 *   否则同一段话在两端会生成两段不同的提示词。
 * - **按钮排往哪边**。选区贴着视口顶部时，按惯例开在上方的浮条会掉出屏幕。
 */
import type { IconName } from '../icons'
import { shouldFlipUp, type Rect } from './overlay'

/** 一个选区动作。`id` 交给调用方去分派，组件不关心它到底怎么改写 */
export interface SelectionAction {
  id: string
  label: string
  /** 图标名，取自共享图标表 */
  icon?: IconName
  disabled?: boolean
}

/** 选区上限。超过这个长度就不给动作——太长的选区改写出来读者无法逐句核对 */
export const SELECTION_MAX = 2000

/**
 * 选区文本的清理。
 *
 * 折行处的换行换成空格而不是删掉：中英混排里删掉换行会把
 * 「the quick\nbrown」粘成「quickbrown」。连续空白并成一个，
 * 段落之间的空行保留——那是作者的分段，不是多余空白。
 */
export function cleanSelection(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .split(/\n{2,}/)
    .map((para) => para.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n\n')
}

/**
 * 这个选区值不值得弹出动作条。
 *
 * 只选中空白不算：拖选时手一抖就会划过一个空格，此时冒出一排按钮，
 * 用户还没开始选就得先把它关掉。
 */
export function hasSelection(text: string, max = SELECTION_MAX): boolean {
  const clean = cleanSelection(text)
  return clean.length > 0 && clean.length <= max
}

/** 选区过长：有内容但超出上限。与 hasSelection 分开，好给出不同的说法 */
export function selectionTooLong(text: string, max = SELECTION_MAX): boolean {
  return cleanSelection(text).length > max
}

/**
 * 选区的字数说明。
 *
 * 按清理后的长度数，而不是原始字符数：读者看到的是那段话，
 * 不是它在 DOM 里带了多少缩进空格。
 */
export function selectionCount(text: string): number {
  return cleanSelection(text).length
}

/** 引文摘要：动作条上回显选了什么，太长就从中间省略 */
export function selectionExcerpt(text: string, max = 48): string {
  const clean = cleanSelection(text).replace(/\n+/g, ' ')
  if (clean.length <= max) return clean
  // 从中间省略而不是掐尾：掐尾之后好几段不同的选区看起来一模一样
  const head = Math.ceil((max - 1) / 2)
  const tail = max - 1 - head
  return `${clean.slice(0, head)}…${clean.slice(clean.length - tail)}`
}

/** 动作条相对选区的落点 */
export interface SelectionAnchor {
  x: number
  y: number
  /** 开在选区上方还是下方 */
  placement: 'top' | 'bottom'
}

/**
 * 动作条摆哪儿。
 *
 * 默认开在选区上方——手指或指针刚划过的那片正被自己遮着，开在下方等于
 * 让用户挪开手才看得见。上方放不下时才翻到下方，判定复用 `shouldFlipUp`
 * 的同一套算法（反过来用），免得两处对「放不下」的定义不一样。
 *
 * 横向以选区中点为准再夹回视口：不夹的话，选区贴着右边缘时动作条一半在屏幕外。
 */
export function selectionAnchor(
  selection: Rect,
  bar: { width: number; height: number },
  viewport: { width: number; height: number },
  gap = 8
): SelectionAnchor {
  // shouldFlipUp 回答的是「贴下方放不下要不要翻上去」，这里默认在上方，
  // 所以反过来问：把选区当触发器，若它说「不用翻上去」，就说明下方更宽裕
  const preferBelow = !shouldFlipUp(selection, bar.height + gap, viewport.height, gap)
  const above = selection.y - bar.height - gap
  const placement = preferBelow && above < gap ? 'bottom' : 'top'

  const centered = selection.x + selection.width / 2 - bar.width / 2
  const maxX = Math.max(gap, viewport.width - bar.width - gap)
  return {
    x: Math.min(Math.max(gap, centered), maxX),
    y: placement === 'top' ? Math.max(gap, above) : selection.y + selection.height + gap,
    placement
  }
}
