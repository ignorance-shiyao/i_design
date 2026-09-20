/**
 * 旭日图的几何：把层级汇总契约算出的 0–1 位置摊成同心圆环上的扇段。
 *
 * 为什么这段不写在组件里：三个 Web 端都要画同一条 SVG path，
 * 各写一遍就会各错一处——而画错的扇段不会报错，只是角度差几度，
 * 没人看得出来，直到有人拿两个端的截图对比。
 *
 * 两个坑值得单说：
 *
 * **整圈的那一段画不出来。** SVG 的圆弧由起止两点确定，起点与终点重合时
 * 「走哪一条弧」是未定义的，浏览器一律画成一个点——于是只有一个根节点的
 * 旭日图整张是空的。必须拆成两个半圈。这个情况一点也不罕见：
 * 单根数据、下钻到某一支之后，都是整圈。
 *
 * **从十二点开始、顺时针走。** 不是审美问题：读者默认的阅读起点在正上方，
 * 而 SVG 的 0 弧度在正右方。这个偏移放在共享层，各端才不会一个从上开始、
 * 一个从右开始。
 */
import type { HierarchyNode } from './hierarchy'

export interface SunburstSector {
  id: string
  label: string
  depth: number
  kind: HierarchyNode['kind']
  /** 内外半径与起止弧度，给不用 SVG 的端（小程序 Canvas、Flutter）直接用 */
  r0: number
  r1: number
  a0: number
  a1: number
  /** SVG path，三个 Web 端共用 */
  path: string
  /** 扇段中点的直角坐标，用来放标签或引导线 */
  cx: number
  cy: number
  /**
   * 取色序号：同一支（同一个顶层祖先）下的所有层用同一个号。
   *
   * 直接取自模型：在视图上重新编号会让同一支在下钻前后变成两种颜色。
   * 颜色只是辅助——每个扇段都有文字标签与清单条目，灰度打印同样读得出来。
   */
  colorIndex: number
  description: string
}

export interface SunburstOptions {
  /** 画布边长；圆心固定在正中 */
  size?: number
  /** 中心留白的半径。中心要放合计文字，也让最内圈不至于挤成一个点 */
  innerRadius?: number
  /** 只画到第几层（含）。更深的层不画，但模型里仍然在，清单上读得到 */
  maxDepth?: number
}

/**
 * 分类色一共八档，超出的支不再循环取色。
 *
 * 循环回第一个色，读者会把第九支和第一支当成同一类——那比没有颜色更糟。
 * 超出的支画成中性色，身份由清单里的文字承担（颜色本来就不是唯一线索）。
 * 真要区分九类以上，该做的是在数据侧合并成「其他」，不是再造一个颜色。
 */
export const CHART_PALETTE_SIZE = 8

const TAU = Math.PI * 2
/** 起点扳到十二点：SVG 的 0 弧度在正右方 */
const OFFSET = -Math.PI / 2

/** 小于这个角度的扇段不画——画出来是一条看不见的缝，却能被 Tab 到 */
const MIN_ANGLE = 0.0005

const polar = (cx: number, cy: number, r: number, a: number) => ({
  x: cx + r * Math.cos(a),
  y: cy + r * Math.sin(a)
})

const round = (n: number) => Math.round(n * 1000) / 1000

/** 一段环形扇区的 path。整圈走两个半圈，否则 SVG 画成一个点 */
function arcPath(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number): string {
  const span = a1 - a0
  if (span >= TAU - 1e-9) {
    const mid = a0 + Math.PI
    const outerStart = polar(cx, cy, r1, a0)
    const outerMid = polar(cx, cy, r1, mid)
    const innerStart = polar(cx, cy, r0, a0)
    const innerMid = polar(cx, cy, r0, mid)
    const ring =
      `M ${round(outerStart.x)} ${round(outerStart.y)}` +
      ` A ${round(r1)} ${round(r1)} 0 0 1 ${round(outerMid.x)} ${round(outerMid.y)}` +
      ` A ${round(r1)} ${round(r1)} 0 0 1 ${round(outerStart.x)} ${round(outerStart.y)} Z`
    if (r0 <= 0) return ring
    return (
      ring +
      ` M ${round(innerStart.x)} ${round(innerStart.y)}` +
      ` A ${round(r0)} ${round(r0)} 0 0 0 ${round(innerMid.x)} ${round(innerMid.y)}` +
      ` A ${round(r0)} ${round(r0)} 0 0 0 ${round(innerStart.x)} ${round(innerStart.y)} Z`
    )
  }
  const large = span > Math.PI ? 1 : 0
  const o0 = polar(cx, cy, r1, a0)
  const o1 = polar(cx, cy, r1, a1)
  const i1 = polar(cx, cy, r0, a1)
  const i0 = polar(cx, cy, r0, a0)
  return (
    `M ${round(o0.x)} ${round(o0.y)}` +
    ` A ${round(r1)} ${round(r1)} 0 ${large} 1 ${round(o1.x)} ${round(o1.y)}` +
    ` L ${round(i1.x)} ${round(i1.y)}` +
    ` A ${round(r0)} ${round(r0)} 0 ${large} 0 ${round(i0.x)} ${round(i0.y)} Z`
  )
}

/**
 * 摊成扇段。入参是 `buildHierarchy` 或 `hierarchyView` 的节点，顺序照搬。
 *
 * 环宽按**实际要画的层数**均分，而不是按模型的总层数：下钻之后剩两层，
 * 就该把这两层撑满整个圆，否则越钻越细，点都点不中。
 */
export function sunburstSectors(
  nodes: readonly HierarchyNode[],
  { size = 200, innerRadius = 24, maxDepth }: SunburstOptions = {}
): SunburstSector[] {
  const center = size / 2
  const visible = nodes.filter((node) => maxDepth === undefined || node.depth <= maxDepth)
  const deepest = visible.reduce((acc, node) => Math.max(acc, node.depth), 0)
  const outerRadius = center
  const ring = deepest >= 0 ? (outerRadius - innerRadius) / (deepest + 1) : 0

  const sectors: SunburstSector[] = []
  for (const node of visible) {
    const a0 = node.start * TAU + OFFSET
    const a1 = node.end * TAU + OFFSET
    if (a1 - a0 < MIN_ANGLE) continue
    const r0 = innerRadius + node.depth * ring
    const r1 = r0 + ring
    const mid = polar(center, center, (r0 + r1) / 2, (a0 + a1) / 2)
    sectors.push({
      id: node.id,
      label: node.label,
      depth: node.depth,
      kind: node.kind,
      r0,
      r1,
      a0,
      a1,
      path: arcPath(center, center, r0, r1, a0, a1),
      cx: round(mid.x),
      cy: round(mid.y),
      colorIndex: node.colorIndex,
      description: node.description
    })
  }
  return sectors
}
