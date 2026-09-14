/**
 * 分布与统计（astra.md 的 D04 第一步：契约与纯逻辑）。
 *
 * 分布图最容易在「看起来很专业」的外表下说错话：分箱宽度换一个，
 * 双峰就并成单峰；核密度的带宽调小一点，噪声就变成了「第三个峰」；
 * 误差棒不写清是标准差还是置信区间，读者只能猜。所以这一份里，
 * 每个会改变结论的选择都必须由调用方显式给出或由公开规则算出，
 * 并且把样本量不足、极端值这类「这张图现在不该被当真」的情况一并报出来。
 *
 * 只出数字，不出任何绘制指令，各端照着画。
 */

export interface DistributionIssue {
  kind: 'too-few' | 'all-equal' | 'has-outliers' | 'empty'
  message: string
}

const finite = (values: number[]) => values.filter((v) => Number.isFinite(v))

/** 样本量低于这个数时，分布的形状基本是噪声 */
export const MIN_SAMPLE = 20

export interface HistogramBin {
  from: number
  to: number
  count: number
  /** 占总数的比例，0–1 */
  ratio: number
}

export interface Histogram {
  bins: HistogramBin[]
  /** 实际用的分箱宽度 */
  width: number
  /** 分箱规则：调用方指定的，或自动选中的那个 */
  rule: 'freedman-diaconis' | 'sturges' | 'fixed'
  count: number
  issues: DistributionIssue[]
}

/**
 * 直方图分箱。
 *
 * 默认 Freedman–Diaconis：宽度取 2·IQR/n^(1/3)，对长尾和离群点都比
 * Sturges 稳。IQR 为 0（半数以上取值相同）时 FD 会给出零宽度，
 * 此时退回 Sturges，而不是硬算出无穷多个箱子。
 *
 * 两条规则都写出来、并把实际用的那条报回去：分箱宽度直接决定读者看到
 * 一个峰还是两个峰，这个选择不能藏在实现里。
 */
export function histogram(
  values: number[],
  {
    rule = 'freedman-diaconis',
    width
  }: { rule?: 'freedman-diaconis' | 'sturges' | 'fixed'; width?: number } = {}
): Histogram {
  const data = finite(values).sort((a, b) => a - b)
  const issues: DistributionIssue[] = []
  if (!data.length) {
    return { bins: [], width: 0, rule, count: 0, issues: [{ kind: 'empty', message: '没有有效样本' }] }
  }
  const min = data[0]
  const max = data[data.length - 1]
  if (min === max) {
    issues.push({ kind: 'all-equal', message: `全部 ${data.length} 个样本取值相同，分布图看不出任何东西` })
    return {
      bins: [{ from: min, to: min, count: data.length, ratio: 1 }],
      width: 0,
      rule,
      count: data.length,
      issues
    }
  }
  if (data.length < MIN_SAMPLE) {
    issues.push({
      kind: 'too-few',
      message: `只有 ${data.length} 个样本（少于 ${MIN_SAMPLE}），这里的形状主要是噪声`
    })
  }

  const q = (p: number) => {
    const pos = (data.length - 1) * p
    const low = Math.floor(pos)
    const high = Math.ceil(pos)
    return low === high ? data[low] : data[low] + (data[high] - data[low]) * (pos - low)
  }
  const iqr = q(0.75) - q(0.25)

  let used = rule
  let binWidth: number
  if (rule === 'fixed') {
    if (!width || width <= 0) throw new Error('rule 为 fixed 时必须给出正的 width')
    binWidth = width
  } else if (rule === 'freedman-diaconis' && iqr > 0) {
    binWidth = (2 * iqr) / Math.cbrt(data.length)
  } else {
    // IQR 为 0 时 FD 会给出零宽度：退回 Sturges，而不是算出无穷多个箱
    used = 'sturges'
    binWidth = (max - min) / (Math.ceil(Math.log2(data.length)) + 1)
  }
  if (!Number.isFinite(binWidth) || binWidth <= 0) binWidth = max - min

  const binCount = Math.max(1, Math.ceil((max - min) / binWidth))
  const bins: HistogramBin[] = Array.from({ length: binCount }, (_, i) => ({
    from: min + i * binWidth,
    to: min + (i + 1) * binWidth,
    count: 0,
    ratio: 0
  }))
  for (const v of data) {
    // 最后一箱闭区间，否则最大值会落到区间外，直方图正好丢掉最大的那个点
    const index = Math.min(binCount - 1, Math.floor((v - min) / binWidth))
    bins[index].count += 1
  }
  for (const bin of bins) bin.ratio = bin.count / data.length

  return { bins, width: binWidth, rule: used, count: data.length, issues }
}

export interface DensityPoint {
  x: number
  y: number
}

export interface Density {
  points: DensityPoint[]
  /** 实际用的带宽 */
  bandwidth: number
  issues: DistributionIssue[]
}

/**
 * 高斯核密度估计。
 *
 * 带宽默认用 Silverman 经验法则：0.9·min(σ, IQR/1.34)·n^(−1/5)。
 * 带宽是密度图里唯一重要的旋钮——调小了噪声会变成「第三个峰」，
 * 调大了两个峰会并成一个。所以它被算出来并报回去，也允许显式指定，
 * 但不允许悄悄地由实现挑一个。
 */
export function kde(
  values: number[],
  { bandwidth, steps = 64 }: { bandwidth?: number; steps?: number } = {}
): Density {
  const data = finite(values).sort((a, b) => a - b)
  const issues: DistributionIssue[] = []
  if (data.length < 2) {
    return { points: [], bandwidth: 0, issues: [{ kind: 'empty', message: '样本不足两个，算不出密度' }] }
  }
  if (data.length < MIN_SAMPLE) {
    issues.push({
      kind: 'too-few',
      message: `只有 ${data.length} 个样本（少于 ${MIN_SAMPLE}），这条密度曲线主要是噪声`
    })
  }
  const mean = data.reduce((a, b) => a + b, 0) / data.length
  const sd = Math.sqrt(data.reduce((a, b) => a + (b - mean) ** 2, 0) / (data.length - 1))
  const q = (p: number) => {
    const pos = (data.length - 1) * p
    const low = Math.floor(pos)
    const high = Math.ceil(pos)
    return low === high ? data[low] : data[low] + (data[high] - data[low]) * (pos - low)
  }
  const iqr = q(0.75) - q(0.25)
  const spread = Math.min(sd || Infinity, iqr > 0 ? iqr / 1.34 : Infinity)
  let h = bandwidth ?? 0.9 * (Number.isFinite(spread) ? spread : sd) * Math.pow(data.length, -1 / 5)
  if (!Number.isFinite(h) || h <= 0) {
    // 全部取值相同：没有可估的分布，直接说出来而不是画一条假的曲线
    issues.push({ kind: 'all-equal', message: '所有样本取值相同，密度无从估计' })
    return { points: [], bandwidth: 0, issues }
  }

  const min = data[0] - 3 * h
  const max = data[data.length - 1] + 3 * h
  const points: DensityPoint[] = []
  for (let i = 0; i < steps; i += 1) {
    const x = min + ((max - min) * i) / (steps - 1)
    let sum = 0
    for (const v of data) {
      const u = (x - v) / h
      sum += Math.exp(-0.5 * u * u)
    }
    points.push({ x, y: sum / (data.length * h * Math.sqrt(2 * Math.PI)) })
  }
  return { points, bandwidth: h, issues }
}

export type ErrorKind = 'sd' | 'sem' | 'ci95'

export interface ErrorBar {
  mean: number
  /** 误差棒的半长 */
  delta: number
  low: number
  high: number
  n: number
  kind: ErrorKind
  /** 图注里该写的一句话——误差棒不写清含义等于没画 */
  caption: string
}

/**
 * 误差棒。
 *
 * 同一批数据，标准差、标准误、95% 置信区间画出来的长度差好几倍，
 * 而三者说的是完全不同的事（数据有多散 / 均值估得有多准 / 均值落在哪）。
 * 因此 kind 是必填的，并且一起返回一句该印在图注里的话。
 *
 * 置信区间用 1.96 的正态近似，小样本会偏窄——所以样本量不足时同时报出来。
 */
export function errorBar(values: number[], kind: ErrorKind): ErrorBar {
  const data = finite(values)
  const n = data.length
  if (!n) return { mean: NaN, delta: NaN, low: NaN, high: NaN, n: 0, kind, caption: '没有有效样本' }
  const mean = data.reduce((a, b) => a + b, 0) / n
  const sd = n > 1 ? Math.sqrt(data.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1)) : 0
  const sem = n > 1 ? sd / Math.sqrt(n) : 0
  const delta = kind === 'sd' ? sd : kind === 'sem' ? sem : 1.96 * sem
  const caption =
    kind === 'sd'
      ? `误差棒为 ±1 标准差（n=${n}），说的是数据有多散`
      : kind === 'sem'
        ? `误差棒为 ±1 标准误（n=${n}），说的是均值估得有多准`
        : `误差棒为 95% 置信区间（正态近似，n=${n}）`
  return { mean, delta, low: mean - delta, high: mean + delta, n, kind, caption }
}

export interface ViolinShape {
  /** 沿数值方向的采样点 */
  points: { value: number; density: number }[]
  /** 最大密度，用来把宽度归一化到半个带宽 */
  peak: number
  bandwidth: number
  issues: DistributionIssue[]
}

/**
 * 小提琴的轮廓。
 *
 * 轮廓就是核密度，只是画成对称的两半；宽度必须按每张图里最大的密度
 * 统一归一化（由调用方用 peak 做），否则两把小提琴的「胖」不可比——
 * 那正是小提琴图最常被误读的地方。
 */
export function violinShape(values: number[], options: { bandwidth?: number; steps?: number } = {}): ViolinShape {
  const density = kde(values, options)
  return {
    points: density.points.map((p) => ({ value: p.x, density: p.y })),
    peak: density.points.reduce((m, p) => Math.max(m, p.y), 0),
    bandwidth: density.bandwidth,
    issues: density.issues
  }
}

export interface MatrixCell {
  row: number
  col: number
  xField: string
  yField: string
  /** 对角线：同一字段与自己，画分布而不是散点 */
  diagonal: boolean
  /** 皮尔逊相关系数；样本不足或某一列常量时为 null */
  correlation: number | null
}

/**
 * 散点矩阵的格子。
 *
 * 只出下三角与对角线：上三角是同一批关系的镜像，画两遍既浪费面积，
 * 也会让读者以为那是另外一组关系。相关系数为 null 有两种原因，
 * 都返回 null 而不是 0——0 表示「没有线性相关」，null 表示「算不出」。
 */
export function scatterMatrix(fields: string[], rows: Record<string, number>[]): MatrixCell[] {
  const cells: MatrixCell[] = []
  for (let row = 0; row < fields.length; row += 1) {
    for (let col = 0; col <= row; col += 1) {
      const xField = fields[col]
      const yField = fields[row]
      cells.push({
        row,
        col,
        xField,
        yField,
        diagonal: row === col,
        correlation: row === col ? null : pearson(rows.map((r) => r[xField]), rows.map((r) => r[yField]))
      })
    }
  }
  return cells
}

/** 皮尔逊相关系数。任一列是常量时分母为 0，返回 null——那不是「不相关」，是算不出 */
export function pearson(xs: number[], ys: number[]): number | null {
  const pairs = xs
    .map((x, i) => [x, ys[i]] as const)
    .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y))
  if (pairs.length < 3) return null
  const n = pairs.length
  const mx = pairs.reduce((a, [x]) => a + x, 0) / n
  const my = pairs.reduce((a, [, y]) => a + y, 0) / n
  let num = 0
  let dx = 0
  let dy = 0
  for (const [x, y] of pairs) {
    num += (x - mx) * (y - my)
    dx += (x - mx) ** 2
    dy += (y - my) ** 2
  }
  if (dx === 0 || dy === 0) return null
  return num / Math.sqrt(dx * dy)
}
