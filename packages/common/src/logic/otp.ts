/**
 * 一次性验证码输入的取值规则。
 *
 * 看着只是几个并排的输入框，实际要处理的分支比想象中多：粘贴一整串验证码、
 * 在中间某格删除、用手机自动填充。这些规则写在组件里，各端就会各自解释一遍——
 * 一端粘贴能自动分配、另一端只填进第一格，同一个短信在两端上的体验完全不同。
 */

export type OtpMode = 'numeric' | 'alphanumeric'

const PATTERN: Record<OtpMode, RegExp> = {
  numeric: /[0-9]/,
  alphanumeric: /[0-9a-zA-Z]/
}

/** 单个字符是否可接受。不可接受的直接丢弃，而不是填进去再标红 */
export function isOtpChar(char: string, mode: OtpMode = 'numeric'): boolean {
  return char.length === 1 && PATTERN[mode].test(char)
}

/**
 * 把粘贴进来的一串文本分配到各格。
 *
 * 先剔掉所有不合规字符再分配：短信里的验证码常常带空格或连字符
 * （「123 456」「123-456」），逐字填的话会把空格也占掉一格，
 * 用户看到的是填了一半且顺序全乱。
 */
export function otpFromText(text: string, length: number, mode: OtpMode = 'numeric'): string[] {
  const chars = [...text].filter((char) => isOtpChar(char, mode)).slice(0, length)
  return Array.from({ length }, (_, i) => chars[i] ?? '')
}

/** 各格拼成完整的值。中间有空格时不拼——半截的验证码没有意义 */
export function otpValue(cells: string[]): string {
  return cells.every((cell) => cell !== '') ? cells.join('') : ''
}

/**
 * 在某一格输入后，光标应当落在哪一格。
 *
 * 填完最后一格时停在原地而不是回到第一格：回到第一格会让人以为自己填错了，
 * 而这时正确的反馈是「已经填完」——由调用方去提交。
 */
export function otpNextIndex(index: number, length: number): number {
  return Math.min(index + 1, length - 1)
}

/**
 * 退格时的行为。
 *
 * 当前格有值就只清当前格；当前格已空才退到前一格并清掉它——
 * 少了这条判断，用户想改最后一个字符时会连前一个一起删掉。
 */
export function otpBackspace(
  cells: string[],
  index: number
): { cells: string[]; index: number } {
  const next = [...cells]
  if (next[index] !== '') {
    next[index] = ''
    return { cells: next, index }
  }
  const prev = Math.max(index - 1, 0)
  next[prev] = ''
  return { cells: next, index: prev }
}
