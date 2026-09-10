/**
 * 词云的字号映射与布局。
 *
 * 词云容易做成「好看但读不出信息」的那一类图：字号跳得太狠，
 * 第二名看起来只有第一名的零头；或者词互相压着，读者以为渲染坏了。
 * 这里把字号映射与避让都固定下来，各端拿到的是同一份坐标。
 *
 * 只做纯计算：文字宽高由调用方量好传进来（Web 用 canvas measureText、
 * Flutter 用 TextPainter、小程序用 measureText），这里不碰任何绘制 API。
 */

export interface WordItem {
  text: string
  /** 权重，通常是词频 */
  value: number
}

export interface WordPlacement extends WordItem {
  /** 中心点坐标 */
  x: number
  y: number
  fontSize: number
  /** 色板槽位，由调用方映射成具体颜色 */
  slot: number
  /** 竖排。竖排只给短词用，长词竖过来会戳出画布 */
  rotated: boolean
}

/** 字号下限：再小就读不出来了，不如不画 */
export const WORD_MIN_SIZE = 12
export const WORD_MAX_SIZE = 48

/**
 * 权重映射成字号，按面积而不是按高度。
 *
 * 人读字的「大小」接近读它占的面积，而字面积随字号平方增长。
 * 直接按值线性给字号，权重差 4 倍的两个词看起来会差 16 倍，
 * 第二名于是被压成背景噪声。开平方之后，视觉上的大小比才接近真实的权重比。
 *
 * 全部同值时统一给中间字号——线性映射在这种情况下要除以 0。
 */
export function wordFontSize(
  value: number,
  min: number,
  max: number,
  { minSize = WORD_MIN_SIZE, maxSize = WORD_MAX_SIZE } = {}
): number {
  if (max <= min) return (minSize + maxSize) / 2
  const t = (value - min) / (max - min)
  return minSize + (maxSize - minSize) * Math.sqrt(t)
}

interface Box {
  x: number
  y: number
  width: number
  height: number
}

const overlaps = (a: Box, b: Box, pad: number) =>
  a.x - pad < b.x + b.width &&
  a.x + a.width + pad > b.x &&
  a.y - pad < b.y + b.height &&
  a.y + a.height + pad > b.y

/**
 * 阿基米德螺线布局。
 *
 * 从中心起沿螺线往外找第一个不碰撞的位置：权重最大的词先放，
 * 因此它一定落在正中，读者第一眼看到的就是第一名。
 * 反过来（随机放或按输入顺序放）会让最大的词出现在角落，
 * 那张图读起来就没有中心了。
 *
 * 放不下的词直接丢掉而不是硬塞：硬塞出来的是叠字，
 * 两个词都读不出来，比少一个词更糟。返回值因此可能短于输入。
 */
export function wordLayout(
  words: (WordItem & { width: number; height: number })[],
  width: number,
  height: number,
  { padding = 2, rotate = true, minSize = WORD_MIN_SIZE, maxSize = WORD_MAX_SIZE } = {}
): WordPlacement[] {
  const valid = words.filter((w) => w.value > 0 && w.text)
  if (!valid.length || width <= 0 || height <= 0) return []

  const sorted = [...valid].sort((a, b) => b.value - a.value)
  const min = sorted[sorted.length - 1].value
  const max = sorted[0].value

  const placed: Box[] = []
  const out: WordPlacement[] = []
  const cx = width / 2
  const cy = height / 2

  sorted.forEach((word, index) => {
    const fontSize = wordFontSize(word.value, min, max, { minSize, maxSize })
    // 传进来的宽高按基准字号量得，这里按实际字号等比缩放，
    // 免得调用方为每个词各量一次
    const scale = fontSize / maxSize
    // 竖排只给短词：长词竖过来会戳出画布上下沿，怎么挪都放不下
    const rotated = rotate && word.text.length <= 4 && index % 5 === 4
    const w = (rotated ? word.height : word.width) * scale
    const h = (rotated ? word.width : word.height) * scale

    // 螺线步长与字号挂钩：字大就迈大步，否则大词要试上千个几乎重合的位置
    const step = Math.max(2, fontSize / 6)
    /*
     * 螺线按画布长宽比拉成椭圆，而不是正圆。
     * 正圆螺线在 2:1 的画布上会先把上下撑满、然后就再也放不下，
     * 左右两侧空出一大片——图看起来像被居中裁过一刀。
     */
    const aspect = width / height
    for (let t = 0; t < 3000; t++) {
      const angle = t * 0.25
      const radius = step * angle * 0.12
      const x = cx + radius * aspect * Math.cos(angle) - w / 2
      const y = cy + radius * Math.sin(angle) - h / 2
      // 越界即放弃这个候选点，而不是夹回边界内——
      // 夹回去会让一圈词全都贴着边排成一条线
      if (x < 0 || y < 0 || x + w > width || y + h > height) continue
      const box = { x, y, width: w, height: h }
      if (placed.some((p) => overlaps(box, p, padding))) continue
      placed.push(box)
      out.push({
        text: word.text,
        value: word.value,
        x: x + w / 2,
        y: y + h / 2,
        fontSize,
        slot: index,
        rotated
      })
      break
    }
  })

  return out
}

/**
 * 有多少词没放下。
 *
 * 组件要据此给一句提示：读者看到词少了，得知道是「数据里就这些」
 * 还是「画布太小放不下」——这两者的结论完全不同。
 */
export function wordOverflow(
  words: WordItem[],
  placed: WordPlacement[]
): number {
  return Math.max(0, words.filter((w) => w.value > 0 && w.text).length - placed.length)
}

/**
 * 词该用哪一档颜色。
 *
 * 词云不用分类色板：分类色表示「身份不同」，而词云里各词并没有身份之分，
 * 给它们各上一个颜色只是把噪声画成了信息——而且词一多就必然要循环取色，
 * 于是两个不相干的词共用一色，看起来像有关联。
 *
 * 这里按权重排名分三档，颜色只是强化「大小」这一个已有的编码：
 * 大小才是真正的编码，颜色不承担任何独立含义，因此色觉障碍下不丢信息。
 * 档位也决定了对比度——最亮的品牌色只给最大的那几个词，
 * 它作为大字达到 3:1，落到小字上就不够了。
 */
export type WordTone = 'strong' | 'base' | 'muted'

export function wordTone(rank: number, total: number): WordTone {
  if (total <= 0) return 'base'
  const t = rank / total
  if (t < 0.2) return 'strong'
  if (t < 0.6) return 'base'
  return 'muted'
}
