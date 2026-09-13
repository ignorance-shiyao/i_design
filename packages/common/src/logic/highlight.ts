/**
 * 轻量语法高亮：把代码切成词法单元。
 *
 * 不引第三方库：预览页要内联成单文件，各端也不该为了高亮各装一个几百 KB 的库。
 * 做法是每种语言一条合并的具名分组正则，一次扫描切出词法单元。
 *
 * **输出的是 token 数组，不是 HTML 字符串**。原先站点里那份返回拼好的 HTML，
 * 要靠 `v-html` 渲染——在一个专门做 AI 交互的组件库里，代码块里的内容常常来自
 * 模型与工具的输出，那是不可信内容。返回 token 让各端自己拼节点，
 * 这条注入路径就根本不存在；顺带小程序与 Flutter 也能用同一份切分结果。
 */

export type Lang = 'vue' | 'html' | 'ts' | 'js' | 'css' | 'json' | 'bash' | 'text'

/** token 类型即正则里的分组名；`text` 是未匹配到的部分 */
export interface CodeToken {
  type: string
  text: string
}

/** 每条分组名即 token 类型，顺序决定优先级：注释、字符串永远排在最前 */
const patterns: Record<Exclude<Lang, 'text'>, RegExp> = {
  // 文档里的示例常把 setup 代码与模板写在一起，因此 vue 规则同时覆盖两者的词法
  vue: new RegExp(
    [
      '(?<comment><!--[\\s\\S]*?-->|//[^\\n]*)',
      '(?<mustache>\\{\\{[\\s\\S]*?\\}\\})',
      '(?<tag></?[A-Za-z][\\w.-]*(?=[\\s/>]))',
      '(?<directive>\\s(?:v-[\\w:.-]+|[:@#][\\w:.-]+))',
      '(?<attr>\\s[A-Za-z_][\\w.-]*)(?==)',
      '(?<string>`(?:\\\\.|[^`\\\\])*`|"[^"]*"|\'[^\']*\')',
      '(?<keyword>\\b(?:import|from|export|default|const|let|var|function|return|if|else|for|of|in|await|async|new|class|interface|type|typeof|as|template|reactive|computed|ref)\\b)',
      '(?<literal>\\b(?:true|false|null|undefined)\\b)',
      '(?<number>\\b\\d[\\d_]*(?:\\.\\d+)?\\b)',
      '(?<fn>\\b[A-Za-z_$][\\w$]*(?=\\())',
      '(?<punct>[<>/=]|=>|[{}()\\[\\];,])'
    ].join('|'),
    'g'
  ),
  ts: new RegExp(
    [
      '(?<comment>//[^\\n]*|/\\*[\\s\\S]*?\\*/)',
      '(?<string>`(?:\\\\.|[^`\\\\])*`|"(?:\\\\.|[^"\\\\])*"|\'(?:\\\\.|[^\'\\\\])*\')',
      '(?<regexp>/(?![*/])(?:\\\\.|\\[[^\\]]*\\]|[^/\\n\\\\])+/[gimsuy]*)',
      '(?<keyword>\\b(?:import|from|export|default|const|let|var|function|return|if|else|for|of|in|while|await|async|new|class|extends|interface|type|enum|implements|typeof|instanceof|as|try|catch|finally|throw|switch|case|break|continue|readonly|public|private|delete|void|yield|satisfies)\\b)',
      '(?<literal>\\b(?:true|false|null|undefined|this|NaN|Infinity)\\b)',
      '(?<number>\\b\\d[\\d_]*(?:\\.\\d+)?(?:e[+-]?\\d+)?\\b)',
      '(?<fn>\\b[A-Za-z_$][\\w$]*(?=\\s*\\())',
      '(?<klass>\\b[A-Z][\\w$]*\\b)',
      '(?<prop>\\b[A-Za-z_$][\\w$]*(?=\\s*:))',
      '(?<punct>[{}()[\\];,.]|=>|[+\\-*/%<>=!&|?]+)'
    ].join('|'),
    'g'
  ),
  css: new RegExp(
    [
      '(?<comment>/\\*[\\s\\S]*?\\*/)',
      '(?<string>"[^"]*"|\'[^\']*\')',
      '(?<atrule>@[\\w-]+)',
      '(?<variable>--[\\w-]+)',
      '(?<fn>\\b[\\w-]+(?=\\())',
      '(?<number>#[0-9a-fA-F]{3,8}\\b|\\b\\d*\\.?\\d+(?:px|rem|em|%|s|ms|vh|vw|fr|deg)?\\b)',
      '(?<prop>[\\w-]+(?=\\s*:))',
      '(?<selector>[.#][\\w-]+|::?[\\w-]+)',
      '(?<punct>[{};:,()])'
    ].join('|'),
    'g'
  ),
  json: new RegExp(
    [
      '(?<prop>"(?:\\\\.|[^"\\\\])*"(?=\\s*:))',
      '(?<string>"(?:\\\\.|[^"\\\\])*")',
      '(?<literal>\\b(?:true|false|null)\\b)',
      '(?<number>-?\\b\\d+(?:\\.\\d+)?(?:e[+-]?\\d+)?\\b)',
      '(?<punct>[{}[\\],:])'
    ].join('|'),
    'g'
  ),
  bash: new RegExp(
    [
      '(?<comment>#[^\\n]*)',
      '(?<string>"[^"]*"|\'[^\']*\')',
      '(?<keyword>^\\s*(?:npm|npx|node|yarn|pnpm|git|cd|mkdir|rm|cp|export)\\b)',
      '(?<flag>\\s-{1,2}[\\w-]+)',
      '(?<punct>[|&><])'
    ].join('|'),
    'gm'
  ),
  html: /(?<comment><!--[\s\S]*?-->)|(?<tag><\/?[A-Za-z][\w.-]*)|(?<attr>\s[A-Za-z_][\w.-]*)(?==)|(?<string>"[^"]*"|'[^']*')|(?<punct>[<>/=])/g,
  js: /$^/g // 占位，下方与 ts 共用
}
patterns.js = patterns.ts

/** 语言别名：文档里写 vue / html / ts / js 都能落到同一套规则 */
export function normalizeLang(lang?: string): Lang {
  const value = (lang ?? '').toLowerCase()
  if (['vue', 'template', 'html'].includes(value)) return 'vue'
  if (['ts', 'typescript', 'js', 'javascript', 'tsx', 'jsx'].includes(value)) return 'ts'
  if (['css', 'scss', 'less'].includes(value)) return 'css'
  if (value === 'json') return 'json'
  if (['bash', 'sh', 'shell'].includes(value)) return 'bash'
  return 'text'
}

/**
 * 猜测语言：文档示例大多不标注，靠特征串判断，
 * 判断不出时退化为纯文本——宁可不高亮，也不要高亮错。
 */
export function detectLang(code: string): Lang {
  const text = code.trim()
  if (/^[[{][\s\S]*[\]}]$/.test(text) && /"\s*:/.test(text)) return 'json'
  if (/^(npm|npx|yarn|pnpm|git|node|cd|mkdir)\b/m.test(text)) return 'bash'
  if (/<\/?[A-Za-z][\w.-]*[\s/>]/.test(text)) return 'vue'
  if (/(^|\n)\s*(--[\w-]+\s*:|[.#][\w-]+\s*\{)/.test(text)) return 'css'
  if (/\b(const|let|import|export|function|=>|interface|type)\b/.test(text)) return 'ts'
  return 'text'
}


/**
 * 切分成 token。
 *
 * 未匹配的部分原样作为 `text` 吐出来，因此把所有 token 的 text 接起来
 * 必然等于原文——少一个字符都说明切错了，单测里就是这么校验的。
 */
export function tokenize(code: string, lang?: Lang | string): CodeToken[] {
  const resolved = lang ? normalizeLang(String(lang)) : detectLang(code)
  if (resolved === 'text') return code ? [{ type: 'text', text: code }] : []

  const pattern = patterns[resolved]
  pattern.lastIndex = 0

  const out: CodeToken[] = []
  let last = 0
  const push = (type: string, text: string) => {
    if (text) out.push({ type, text })
  }

  for (const match of code.matchAll(pattern)) {
    const index = match.index ?? 0
    const groups = match.groups ?? {}
    const type = Object.keys(groups).find((key) => groups[key] !== undefined)
    if (!type) continue

    push('text', code.slice(last, index))
    const raw = match[0]
    // 形如 " :disabled" 的匹配带前导空白，空白不该被着色
    const lead = raw.match(/^\s+/)?.[0] ?? ''
    push('text', lead)
    push(type, raw.slice(lead.length))
    last = index + raw.length
  }
  push('text', code.slice(last))
  return out
}

/** 按行切 token，供带行号的渲染使用；换行本身不进 token */
export function tokenizeLines(code: string, lang?: Lang | string): CodeToken[][] {
  const lines: CodeToken[][] = [[]]
  for (const token of tokenize(code, lang)) {
    const parts = token.text.split('\n')
    parts.forEach((part, i) => {
      if (i > 0) lines.push([])
      if (part) lines[lines.length - 1].push({ type: token.type, text: part })
    })
  }
  return lines
}
