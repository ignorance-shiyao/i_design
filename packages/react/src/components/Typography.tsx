import {
  createElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode
} from 'react'
import { isTextOverflowing, rafThrottle } from '@i-design/common'
import { useConfig } from './ConfigProvider'
import { Icon } from './Icon'
import { Tooltip } from './Tooltip'

export interface TypographyProps {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'body' | 'caption'
  type?: 'default' | 'secondary' | 'tertiary' | 'brand' | 'success' | 'warning' | 'danger'
  strong?: boolean
  italic?: boolean
  underline?: boolean
  /** 删除线，用于表示已失效的值 */
  del?: boolean
  mono?: boolean
  /** true 单行省略；数字表示最多几行 */
  ellipsis?: boolean | number
  /**
   * 截断时把完整内容放进浮层提示。
   * 只有真的截断了才挂——没截断也挂的话，鼠标扫过一列短文案会一路冒浮层。
   */
  ellipsisTooltip?: boolean
  /** 折叠时可展开：多行省略的长文案，读者要有办法读到后半段 */
  expandable?: boolean
  expandText?: string
  collapseText?: string
  /** 末尾附一个复制按钮；不传 copyText 时复制的是渲染出的纯文本 */
  copyable?: boolean
  copyText?: string
  /** 覆盖默认标签 */
  as?: string
  className?: string
  children?: ReactNode
}

export function Typography({
  variant = 'body',
  type = 'default',
  strong = false,
  italic = false,
  underline = false,
  del = false,
  mono = false,
  ellipsis = false,
  ellipsisTooltip = false,
  expandable = false,
  expandText = '',
  collapseText = '',
  copyable = false,
  copyText = '',
  as,
  className = '',
  children
}: TypographyProps) {
  const { locale } = useConfig()
  const expandLabel = expandText || locale.expand
  const collapseLabel = collapseText || locale.collapse
  // 标题的样式与标签默认绑定：视觉层级与文档结构一致，读屏才能正确导航
  const tag = as || (variant.startsWith('h') ? variant : variant === 'caption' ? 'span' : 'p')
  const lines = typeof ellipsis === 'number' ? ellipsis : 0
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const body = useRef<HTMLSpanElement>(null)
  // 展开后就不该再截断，否则按钮点了没反应
  const clamped = lines > 0 && !expanded

  /* ------------------------------------------------------ 截断才给提示 */

  const root = useRef<HTMLElement>(null)
  const [overflowing, setOverflowing] = useState(false)
  const [fullText, setFullText] = useState('')

  /*
   * 量的必须是真正在裁剪的那个元素：多行截断裁在 .i-typo__body 上，
   * 而单行省略的 overflow/white-space 写在根元素上。量错了永远量不出溢出。
   */
  const measure = useCallback(() => {
    const el = clamped ? body.current : root.current
    if (!el) return
    const hit = isTextOverflowing(
      {
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight
      },
      clamped
    )
    setOverflowing(hit)
    if (hit) setFullText(el.textContent?.trim() ?? '')
  }, [clamped])

  /*
   * 窗口一变宽，原本截断的可能就不截断了，所以挂了 resize 监听。
   * 合并到每帧一次：拖动窗口边缘会连发上百个事件，而这里每次都要读四个布局值。
   */
  useLayoutEffect(() => {
    if (!ellipsisTooltip) return
    measure()
    const onResize = rafThrottle(measure)
    const el = clamped ? body.current : root.current
    const observer = el ? new ResizeObserver(onResize) : null
    if (el && observer) observer.observe(el)
    window.addEventListener('resize', onResize)
    return () => {
      onResize.cancel()
      observer?.disconnect()
      window.removeEventListener('resize', onResize)
    }
  }, [ellipsisTooltip, measure, clamped])

  useEffect(() => {
    // 展开之后不再截断，提示要跟着撤掉——留着的话浮层与正文一字不差
    if (!ellipsisTooltip) return
    measure()
  }, [expanded, ellipsisTooltip, measure])

  async function copy() {
    // 优先读 DOM 里的实际文本：children 可能是嵌套元素，取 textContent 才准
    const text = copyText || body.current?.textContent?.trim() || ''
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      /*
       * 非安全上下文（http、部分 WebView）里 clipboard API 不可用。
       * 回退到已废弃的 execCommand——这些环境里它是唯一还能用的路径；
       * 再失败就静默，弹一个「复制失败」对用户毫无帮助。
       */
      const area = document.createElement('textarea')
      area.value = text
      area.style.position = 'fixed'
      area.style.opacity = '0'
      document.body.appendChild(area)
      area.select()
      try {
        document.execCommand('copy')
      } catch {
        document.body.removeChild(area)
        return
      }
      document.body.removeChild(area)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  const hasActions = (expandable && lines > 0) || copyable

  return createElement(
    tag,
    {
      ref: root,
      className: [
        'i-typo',
        `i-typo--${variant}`,
        type !== 'default' ? `i-typo--${type}` : '',
        strong ? 'is-strong' : '',
        italic ? 'is-italic' : '',
        underline ? 'is-underline' : '',
        del ? 'is-delete' : '',
        mono ? 'is-mono' : '',
        ellipsis === true ? 'is-ellipsis' : '',
        hasActions ? 'has-actions' : '',
        className
      ]
        .filter(Boolean)
        .join(' ')
    },
    /*
     * 截断作用在内层而不是根元素：clamp 会把展开与复制按钮一起截掉，
     * 于是「有省略号但没有展开入口」——正是最该有入口的那种情况。
     */
    ellipsisTooltip ? (
      /*
       * 开了提示才套这一层。Tooltip 的外壳是 inline-flex，不开也套上去的话，
       * 它会把里面的文字收缩到内容宽度，截断就再也不发生了。
       */
      <Tooltip key="body" content={fullText} disabled={!overflowing}>
        <span
          ref={body}
          className={['i-typo__body', clamped ? 'is-clamp' : ''].filter(Boolean).join(' ')}
          style={clamped ? ({ '--i-typo-lines': lines } as CSSProperties) : undefined}
        >
          {children}
        </span>
      </Tooltip>
    ) : (
      <span
        key="body"
        ref={body}
        className={['i-typo__body', clamped ? 'is-clamp' : ''].filter(Boolean).join(' ')}
        style={clamped ? ({ '--i-typo-lines': lines } as CSSProperties) : undefined}
      >
        {children}
      </span>
    ),
    expandable && lines > 0 ? (
      <button
        key="toggle"
        type="button"
        className="i-typo__toggle"
        aria-expanded={expanded}
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? collapseLabel : expandLabel}
      </button>
    ) : null,
    copyable ? (
      <button key="copy" type="button" className="i-typo__copy" aria-label={copied ? locale.copied : locale.copy} onClick={copy}>
        <Icon name={copied ? 'check' : 'copy'} />
      </button>
    ) : null
  )
}
