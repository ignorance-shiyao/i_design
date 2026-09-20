/**
 * Icicle 图的几何：同一份层级汇总，摊成一排横向的色块而不是同心圆环。
 *
 * 和旭日共用 `buildHierarchy`，因此两张图在同一份数据上的顺序、分母、
 * 取色号、「未细分」的位置完全一致——差别只在这里：旭日把 0–1 乘成角度，
 * 这里乘成横坐标。分开写两套排序，迟早会排出两个样子。
 *
 * 为什么还要有这张图：旭日的外圈扇段越深越细，长度还被曲率压缩，
 * 三层以上就点不中也比不出大小；矩形的宽度是线性的，可以直接比，
 * 标签也放得下。代价是圆环能一眼看出「整体是一个 100%」，矩形不行——
 * 所以这两张图都留着，按层数深浅选。
 */
import type { HierarchyNode } from './hierarchy'

export interface IcicleCell {
  id: string
  label: string
  depth: number
  kind: HierarchyNode['kind']
  x: number
  y: number
  width: number
  height: number
  /**
   * 同一格的横向位置与宽度，改用百分比给一遍。
   *
   * 用 HTML 盒子渲染的端（三个 Web 端）需要它：SVG 的 viewBox 是整体缩放，
   * 窄屏上行高与字会跟着宽度一起缩，320px 下整张图只剩三十来像素高，
   * 字小到读不出来。盒子按百分比排宽度、行高用固定像素，才不会跟着缩。
   * 像素那一组仍然留着，给 Canvas 与 CustomPainter 用。
   */
  xPercent: number
  widthPercent: number
  /** 这一格的宽度够不够写下标签；不够时渲染层只画色块，文字交给清单 */
  labelFits: boolean
  colorIndex: number
  description: string
}

export interface IcicleOptions {
  /** 画布宽度。高度由层数乘行高得出，不另外给 */
  width?: number
  /** 每一层的行高 */
  rowHeight?: number
  /** 只画到第几层（含） */
  maxDepth?: number
  /**
   * 一个汉字的宽度，用来估算标签放不放得下。
   *
   * 估算而不是量：量文字要有渲染环境，而这段逻辑要在小程序和 Flutter 上
   * 跑出同样的结果。估窄一点（宁可少写标签）比估宽一点好——
   * 写不下的标签会溢出到隔壁格子上，看起来像是那一格的名字。
   */
  charWidth?: number
}

/** 小于这个宽度的格子不画：一条看不见的竖缝，却能被 Tab 到 */
const MIN_WIDTH = 0.5

const round = (n: number) => Math.round(n * 1000) / 1000

/**
 * 摊成矩形。入参是 `buildHierarchy` 或 `hierarchyView` 的节点，顺序照搬。
 *
 * 和旭日一样，行高按**实际要画的层数**分配，下钻之后剩几层就画几层。
 */
export function icicleCells(
  nodes: readonly HierarchyNode[],
  { width = 640, rowHeight = 28, maxDepth, charWidth = 14 }: IcicleOptions = {}
): IcicleCell[] {
  const visible = nodes.filter((node) => maxDepth === undefined || node.depth <= maxDepth)
  const cells: IcicleCell[] = []
  for (const node of visible) {
    const w = (node.end - node.start) * width
    if (w < MIN_WIDTH) continue
    cells.push({
      id: node.id,
      label: node.label,
      depth: node.depth,
      kind: node.kind,
      x: round(node.start * width),
      y: round(node.depth * rowHeight),
      width: round(w),
      height: rowHeight,
      xPercent: round(node.start * 100),
      widthPercent: round((node.end - node.start) * 100),
      // 留一个字的余量给左右内边距，否则贴着边框的字会被当成隔壁格子的
      labelFits: w >= (node.label.length + 1) * charWidth,
      colorIndex: node.colorIndex,
      description: node.description
    })
  }
  return cells
}

/** 画布该有多高：画出来的层数乘行高。空数据时是 0，不留一条空白带 */
export function icicleHeight(
  nodes: readonly HierarchyNode[],
  { rowHeight = 28, maxDepth }: IcicleOptions = {}
): number {
  const visible = nodes.filter((node) => maxDepth === undefined || node.depth <= maxDepth)
  if (!visible.length) return 0
  return (visible.reduce((acc, node) => Math.max(acc, node.depth), 0) + 1) * rowHeight
}
