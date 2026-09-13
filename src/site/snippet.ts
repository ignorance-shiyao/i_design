/**
 * 把标签名、属性与插槽内容拼成一段可以直接粘贴的代码。
 *
 * 之所以值得单独写一个函数：调参面板生成的片段此前无论长短一律拆成多行，
 * 于是「一个属性」的按钮也要占四行：
 *
 * ```
 * <IButton
 *   size="lg"
 * >提交</IButton>
 * ```
 *
 * 读者要粘贴的就是这么一小段，却得先在脑子里把它拼回一行。
 * 真正的排版规则是**放得下就一行，放不下才每个属性一行**——
 * 这也是所有格式化工具的做法。
 */

/** 一行放不下就折行的宽度。取 80 是终端与多数编辑器的老惯例 */
export const SNIPPET_WIDTH = 80

/**
 * 一段文字占几列。
 *
 * 不能直接用 `.length`：这是一个中文文档站，`<IButton>提交</IButton>` 里
 * 那两个汉字在等宽字体下各占两列，按字符数算会把一行 100 列宽的代码
 * 判成「还放得下」。CJK、全角标点与假名都按两列算。
 */
export function displayWidth(text: string): number {
  let width = 0
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0
    const wide =
      (code >= 0x1100 && code <= 0x115f) || // 谚文字母
      (code >= 0x2e80 && code <= 0xa4cf) || // 部首、假名、注音、CJK
      (code >= 0xac00 && code <= 0xd7a3) || // 谚文音节
      (code >= 0xf900 && code <= 0xfaff) || // CJK 兼容
      (code >= 0xfe30 && code <= 0xfe6f) || // 竖排标点
      (code >= 0xff00 && code <= 0xff60) || // 全角
      (code >= 0xffe0 && code <= 0xffe6) ||
      (code >= 0x20000 && code <= 0x3fffd) // CJK 扩展
    width += wide ? 2 : 1
  }
  return width
}

export interface SnippetInput {
  /** 标签名，例如 IButton */
  name: string
  /** 已经拼好的属性，例如 `size="lg"`、`disabled`、`:count="3"` */
  attrs: string[]
  /** 插槽里的文字。没有就写成自闭合标签 */
  slot?: string
}

/**
 * 生成标签源码。
 *
 * 自闭合与带插槽两种形态分开处理：`<IIcon name="user" />` 与
 * `<IButton>提交</IButton>` 的收尾方式不同，用一套字符串替换去改写收尾
 * （此前的写法是 `open.replace(/>$/, ' />')`）在属性值里正好有个 `>` 时会改错地方。
 */
export function formatSnippet({ name, attrs, slot }: SnippetInput, width = SNIPPET_WIDTH): string {
  const parts = attrs.filter((attr) => attr.trim().length > 0)
  const selfClosing = slot === undefined || slot === ''

  const oneLine = selfClosing
    ? `<${name}${parts.length ? ' ' + parts.join(' ') : ''} />`
    : `<${name}${parts.length ? ' ' + parts.join(' ') : ''}>${slot}</${name}>`
  if (displayWidth(oneLine) <= width || parts.length === 0) return oneLine

  // 放不下：每个属性独占一行，缩进两格
  const body = parts.map((attr) => `  ${attr}`).join('\n')
  return selfClosing
    ? `<${name}\n${body}\n/>`
    : `<${name}\n${body}\n>${slot}</${name}>`
}
