/**
 * 轻量语法高亮。
 *
 * 不引第三方库：预览页要内联成单文件，且本环境访问不到 CDN。
 * 做法是每种语言一条合并的具名分组正则，一次扫描切出词法单元，
 * 未匹配的部分按纯文本转义输出——因此任何输入都不会破坏 HTML 结构。
 */

export type Lang = 'vue' | 'html' | 'ts' | 'js' | 'css' | 'json' | 'bash' | 'text'

const escapeMap: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => escapeMap[c])
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

/** 输出带 <span class="tok tok--类型"> 的 HTML；输入始终被转义 */
export function highlight(code: string, lang?: Lang | string): string {
  const resolved = lang ? normalizeLang(String(lang)) : detectLang(code)
  if (resolved === 'text') return escapeHtml(code)

  const pattern = patterns[resolved]
  pattern.lastIndex = 0

  let out = ''
  let last = 0
  for (const match of code.matchAll(pattern)) {
    const index = match.index ?? 0
    const groups = match.groups ?? {}
    const type = Object.keys(groups).find((key) => groups[key] !== undefined)
    if (!type) continue

    out += escapeHtml(code.slice(last, index))
    const raw = match[0]
    // 形如 " :disabled" 的匹配带前导空白，空白不该被着色
    const lead = raw.match(/^\s+/)?.[0] ?? ''
    out += lead + `<span class="tok tok--${type}">${escapeHtml(raw.slice(lead.length))}</span>`
    last = index + raw.length
  }
  out += escapeHtml(code.slice(last))
  return out
}
