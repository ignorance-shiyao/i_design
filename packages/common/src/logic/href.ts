/**
 * 外链地址的协议白名单。
 *
 * 链接类组件的地址常常来自不可信的地方——模型与工具的输出、后端返回的检索结果、
 * 用户自己填的字段。把它原样绑到 `href` 上，等于让数据决定点击时执行什么。
 *
 * 现状里之所以没出事，靠的是几处巧合：来源卡与上下文卡都带了 `target="_blank"`，
 * 而浏览器拒绝把 `javascript:` 导航到新上下文；文档站又有路由接管了点击。
 * 这些都不是我们设计的防线，任何一处变动都会让它失效——比如 Link 组件默认
 * `target="_self"`，就不在这层巧合的保护里。
 */

/** 放行：http(s)、mailto、tel、站内绝对路径、锚点、相对路径 */
const ALLOWED = /^(?:https?:\/\/|mailto:|tel:|\/(?!\/)|#|\.{1,2}\/|[\w.~-]+(?:[/?#]|$))/i

/*
 * 控制字符、空白与反斜杠一律拒绝。
 *
 * 浏览器在解析地址前会把 Tab、换行、空字节这些剔掉，于是中间插一个 Tab 的
 * 「java…script:」能绕过朴素的前缀判断却照样执行；反斜杠在某些解析里等同于斜杠，
 * 可以拿来伪造出「看起来是相对路径」的跨站地址。
 */
const HOSTILE = /[\u0000-\u0020\\]/

/**
 * 地址能不能安全地放进 `href`。不能则返回 undefined，
 * 让调用方退化成纯文本，而不是渲染出一个点了会出事的链接。
 *
 * 显式拒绝而不是「洗干净再用」：清洗要穷举所有变形，漏一种就前功尽弃；
 * 白名单只需要列全允许的那几种，列漏了顶多是某个合法链接点不开——
 * 这个方向的错误看得见，另一个方向的看不见。
 *
 * 协议相对地址（`//evil.com`）也在拒绝之列：它跟着当前页面的协议走，
 * 看起来像站内路径，实际指向别的站点。`\/(?!\/)` 就是为了把它挡在外面。
 */
export function safeHref(href?: string | null): string | undefined {
  if (!href) return undefined
  const value = href.trim()
  if (!value || HOSTILE.test(value)) return undefined
  return ALLOWED.test(value) ? value : undefined
}
