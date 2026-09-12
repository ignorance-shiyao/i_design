import { useEffect, useMemo, useState } from 'react'
import { WORD_MAX_SIZE, wordLayout, wordOverflow, wordTone, type WordItem } from '@i-design/common'

export interface ChartWordCloudProps {
  words: WordItem[]
  title?: string
  width?: number
  height?: number
  rotate?: boolean
  className?: string
}

type Measured = WordItem & { width: number; height: number }

/**
 * 词云。
 *
 * 编码是字号，不是颜色：颜色只按排名分三档去强化「大小」，
 * 因此色觉障碍下不丢信息。要拿确切数值仍然得看表，
 * 所以数据表是它的正式读法之一，而不是无障碍的补丁。
 */
export function ChartWordCloud({
  words,
  title = '',
  width = 640,
  height = 320,
  rotate = true,
  className = ''
}: ChartWordCloudProps) {
  const [measured, setMeasured] = useState<Measured[]>([])
  const [showTable, setShowTable] = useState(false)
  const [active, setActive] = useState(-1)

  /*
   * 用 canvas 量字，而不是按「字数 × 字号」估。
   * 估出来的宽度对中文尚可，对拉丁字母能差出一倍——词云的避让全靠这个宽度，
   * 估错的直接后果是词叠在一起。
   */
  useEffect(() => {
    let ctx: CanvasRenderingContext2D | null = null
    if (typeof document !== 'undefined') {
      ctx = document.createElement('canvas').getContext('2d')
      if (ctx) {
        /*
         * 字体要取计算值，不能把 `var(--i-font-family)` 直接塞进 ctx.font——
         * canvas 不解析 CSS 变量，赋一个非法字体串它既不报错也不生效，
         * 只是静静地保留默认的 10px sans-serif，量出来的宽度小了四五倍。
         */
        const family = getComputedStyle(document.body).fontFamily || 'sans-serif'
        ctx.font = `${WORD_MAX_SIZE}px ${family}`
      }
    }

    /*
     * 高度取字体的实际行盒，不能直接拿字号当高度。
     * 48px 的字排出来是 54px 高——字号是 em 方框，字形连同升部降部要比它高一成多。
     * 拿字号当高度，上下相邻的两个词就会啃掉那一成，压在一起。
     */
    const lineHeight = (() => {
      if (!ctx) return WORD_MAX_SIZE * 1.2
      const m = ctx.measureText('设计Ag')
      const ink = (m.fontBoundingBoxAscent ?? 0) + (m.fontBoundingBoxDescent ?? 0)
      return ink > 0 ? ink : WORD_MAX_SIZE * 1.2
    })()

    setMeasured(
      words.map((w) => ({
        ...w,
        width: ctx
          ? ctx.measureText(w.text).width
          : // 退路：中日韩字符按一个全角宽，其余按半角
            [...w.text].reduce(
              (sum, c) => sum + (/[　-鿿＀-￯]/.test(c) ? 1 : 0.55),
              0
            ) * WORD_MAX_SIZE,
        height: lineHeight
      }))
    )
  }, [words])

  const placed = useMemo(
    () => wordLayout(measured, width, height, { rotate }),
    [measured, width, height, rotate]
  )
  const dropped = wordOverflow(words, placed)

  return (
    <figure className={`i-chart i-wordcloud ${className}`.trim()}>
      {title && <figcaption className="i-chart__title">{title}</figcaption>}

      <svg
        className="i-chart__svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={title || '词云'}
        onMouseLeave={() => setActive(-1)}
      >
        {placed.map((word, i) => (
          <text
            key={word.text}
            className={`i-wordcloud__word is-${wordTone(word.slot, placed.length)}${
              active === i ? ' is-active' : ''
            }`}
            x={word.x}
            y={word.y}
            fontSize={word.fontSize}
            textAnchor="middle"
            dominantBaseline="central"
            transform={word.rotated ? `rotate(-90 ${word.x} ${word.y})` : undefined}
            onMouseEnter={() => setActive(i)}
          >
            {word.text}
            <title>{`${word.text}：${word.value}`}</title>
          </text>
        ))}
      </svg>

      {/*
        放不下的词要说出来。读者看到词少了，得知道是「数据里就这些」
        还是「画布太小放不下」——这两者的结论完全不同。
      */}
      {dropped > 0 && (
        <p className="i-wordcloud__note">
          画布放不下 {dropped} 个权重较低的词，可调大尺寸或在数据表里查看全部
        </p>
      )}

      <button className="i-chart__table-toggle" onClick={() => setShowTable((v) => !v)}>
        {showTable ? '收起数据表' : '查看数据表'}
      </button>
      {showTable && (
        <table className="i-chart__table">
          <thead>
            <tr><th>词</th><th>权重</th></tr>
          </thead>
          <tbody>
            {[...words].sort((a, b) => b.value - a.value).map((word) => (
              <tr key={word.text}>
                <td>{word.text}</td>
                <td>{word.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </figure>
  )
}
