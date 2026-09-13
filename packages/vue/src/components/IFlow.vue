<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IFlow.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import IIcon from './IIcon.vue'
import {
  MIN_NODE_H,
  MIN_NODE_W,
  NODE_H,
  NODE_W,
  boundsOf,
  edgeMidpoint,
  edgePath,
  flatten,
  marqueeRect,
  minimapLayout,
  alignGuides,
  autoLayout,
  moveNodes,
  nodesInRect,
  resizeNode,
  snapshotStyle,
  snapshotViewBox,
  viewFromMinimap,
  type FlowEdge,
  type FlowEdgeType,
  type FlowGuide,
  type FlowNode,
  type FlowResizeHandle
} from '@i-design/common'

const props = withDefaults(
  defineProps<{
    nodes: FlowNode[]
    edges: FlowEdge[]
    height?: number
    /** 只读：仍可平移缩放与选中，但不能拖动、缩放节点 */
    readonly?: boolean
    /** 选中的节点。单选也是长度为 1 的数组——两套选中状态迟早会对不上 */
    selection?: string[]
    /** 整图默认连线走向；单条连线可用 edge.type 覆盖 */
    edgeType?: FlowEdgeType
    /** 导出文件名，不含扩展名 */
    exportName?: string
  }>(),
  {
    height: 380,
    readonly: false,
    selection: () => [],
    edgeType: 'polyline',
    exportName: 'flow'
  }
)

const emit = defineEmits<{ (e: 'update:selection', a0: string[]): void; (e: 'move', a0: { id: string; x: number; y: number; width?: number; height?: number }[]): void }>()

const MINIMAP = { width: 168, height: 112 }

const view = ref({ x: 0, y: 0, scale: 1 })
const panning = ref(false)
const dragging = ref<{ ids: string[]; from: { x: number; y: number } } | null>(null)
/* 拖动时的对齐辅助线。松手就清空——它是拖动过程中的提示，不是图的一部分 */
const guides = ref<FlowGuide[]>([])
const resizing = ref<{ id: string; handle: FlowResizeHandle } | null>(null)
const marquee = ref<{ from: { x: number; y: number }; to: { x: number; y: number } } | null>(null)
const marqueeMode = ref(false)
const showMinimap = ref(true)
const root = ref<HTMLElement | null>(null)
const svg = ref<SVGSVGElement | null>(null)

const nodeById = computed(() => new Map(props.nodes.map((n) => [n.id, n])))
const selectedSet = computed(() => new Set(props.selection))

/** 屏幕坐标 → 画布坐标 */
function toCanvas(event: PointerEvent) {
  const rect = root.value?.getBoundingClientRect()
  if (!rect) return { x: 0, y: 0 }
  return {
    x: (event.clientX - rect.left - view.value.x) / view.value.scale,
    y: (event.clientY - rect.top - view.value.y) / view.value.scale
  }
}

/*
 * 撤销 / 重做。
 *
 * 节点数据归调用方所有，组件不改它——所以这里记的不是「快照」，而是每次操作的
 * 起止几何；撤销就是反着 emit 一次 move。这样与「组件不持有数据」的约定不冲突。
 *
 * 一条记录装的是「一次操作涉及的全部节点」而不是单个节点：
 * 框选后批量拖动的十个节点是一次操作，撤销就该一次退回去，
 * 按十次才回到原处的撤销和没有撤销差不多。
 */
type Geometry = { id: string; x: number; y: number; width?: number; height?: number }
interface EditRecord {
  before: Geometry[]
  after: Geometry[]
}
const undoStack = ref<EditRecord[]>([])
const redoStack = ref<EditRecord[]>([])
let editBefore: Geometry[] | null = null
let editAfter: Geometry[] | null = null

const canUndo = computed(() => undoStack.value.length > 0)
const canRedo = computed(() => redoStack.value.length > 0)

const geometryOf = (ids: string[]): Geometry[] =>
  ids
    .map((id) => nodeById.value.get(id))
    .filter((n): n is FlowNode => !!n)
    .map((n) => ({ id: n.id, x: n.x, y: n.y, width: n.width, height: n.height }))

function undo() {
  const record = undoStack.value.pop()
  if (!record) return
  redoStack.value.push(record)
  emit('move', record.before)
}

function redo() {
  const record = redoStack.value.pop()
  if (!record) return
  undoStack.value.push(record)
  emit('move', record.after)
}

function commitEdit() {
  if (!editBefore || !editAfter) return
  const changed = editAfter.some((a, i) => {
    const b = editBefore![i]
    return !b || a.x !== b.x || a.y !== b.y || a.width !== b.width || a.height !== b.height
  })
  // 没真的动过就不入栈，否则「撤销」会在原地空点几次
  if (changed) {
    undoStack.value.push({ before: editBefore, after: editAfter })
    // 新动作让重做栈作废：分支历史会让「重做」跳到一条读者没走过的路径上
    redoStack.value = []
  }
  editBefore = null
  editAfter = null
}

/*
 * 快捷键绑在画布上而不是 window：同一页可能有多张画布，也可能有输入框，
 * 绑到全局会把别处的撤销一起劫走。画布需要 tabindex 才能接到键盘事件。
 */
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('update:selection', [])
    return
  }
  if (!(event.metaKey || event.ctrlKey)) return
  const key = event.key.toLowerCase()
  if (key === 'a') {
    event.preventDefault()
    emit('update:selection', props.nodes.map((n) => n.id))
  } else if (key === 'z' && !event.shiftKey) {
    event.preventDefault()
    undo()
  } else if ((key === 'z' && event.shiftKey) || key === 'y') {
    event.preventDefault()
    redo()
  }
}

function onNodeDown(event: PointerEvent, node: FlowNode) {
  event.stopPropagation()
  // 加选：Shift / Cmd 点击往选中集合里增删，不加修饰键则重置为这一个
  const additive = event.shiftKey || event.metaKey || event.ctrlKey
  let ids: string[]
  if (additive) {
    ids = selectedSet.value.has(node.id)
      ? props.selection.filter((id) => id !== node.id)
      : [...props.selection, node.id]
  } else {
    // 点已在选中集合里的节点不清空选择，否则批量拖动第一下就把组拆了
    ids = selectedSet.value.has(node.id) ? props.selection : [node.id]
  }
  emit('update:selection', ids)
  if (props.readonly || (additive && !ids.includes(node.id))) return

  dragging.value = { ids, from: toCanvas(event) }
  editBefore = geometryOf(ids)
  editAfter = null
  ;(event.target as Element).setPointerCapture?.(event.pointerId)
}

function onHandleDown(event: PointerEvent, node: FlowNode, handle: FlowResizeHandle) {
  event.stopPropagation()
  if (props.readonly) return
  resizing.value = { id: node.id, handle }
  editBefore = geometryOf([node.id])
  editAfter = null
  ;(event.target as Element).setPointerCapture?.(event.pointerId)
}

function onDown(event: PointerEvent) {
  ;(event.currentTarget as Element).setPointerCapture(event.pointerId)
  // 框选模式或按住 Shift：拖出选框；否则点空白处取消选中并平移
  if (marqueeMode.value || event.shiftKey) {
    const point = toCanvas(event)
    marquee.value = { from: point, to: point }
    return
  }
  emit('update:selection', [])
  panning.value = true
  last = { x: event.clientX, y: event.clientY }
}

let last = { x: 0, y: 0 }

function onMove(event: PointerEvent) {
  if (marquee.value) {
    marquee.value = { ...marquee.value, to: toCanvas(event) }
    return
  }
  if (resizing.value) {
    const node = nodeById.value.get(resizing.value.id)
    if (!node) return
    const box = resizeNode(node, resizing.value.handle, toCanvas(event))
    editAfter = [{ id: node.id, ...box }]
    emit('move', editAfter)
    return
  }
  if (dragging.value) {
    const point = toCanvas(event)
    const delta = { x: point.x - dragging.value.from.x, y: point.y - dragging.value.from.y }
    const base = editBefore ?? []
    const asNodes = base.map((g) => ({ ...g, label: '' })) as FlowNode[]
    // 位移量整体吸附一次：逐个吸附会把组内原本的相对间距抹平
    const free = moveNodes(asNodes, dragging.value.ids, delta, 0)
    const grid = moveNodes(asNodes, dragging.value.ids, delta)

    /* 只取尺寸。连 x/y 一起取回来的话，对齐算的就是拖动前的位置，永远是「已经对齐」 */
    const sizeOf = (id: string) => {
      const found = base.find((g) => g.id === id)
      return { width: found?.width, height: found?.height }
    }

    /*
     * 对齐优先于网格。
     *
     * 两者都是吸附，但网格吸的是「整齐」，对齐吸的是「和那一个对上」——
     * 后者才是用户此刻在做的事。先按网格吸的话，节点只能落在 8 的倍数上，
     * 于是要么正好对齐、要么差 8 像素，中间那几像素根本到不了，
     * 辅助线也就永远不出现（实测过：拖 5px 直接跳到差 8px 的位置）。
     *
     * 所以按未吸附的位置算对齐：哪根轴对上了就听对齐的，没对上的那根轴再回到网格。
     *
     * 阈值按缩放换算：缩到 50% 时屏幕上的 6px 是画布上的 12px，
     * 不换算的话图缩得越小越难吸上。
     */
    const anchorId = dragging.value.ids[0]
    const anchor = free.find((m) => m.id === anchorId)
    const picked = new Set(dragging.value.ids)
    const aligned = anchor
      ? alignGuides(
          { ...anchor, label: '', ...sizeOf(anchorId) } as FlowNode,
          props.nodes.filter((n) => !picked.has(n.id)),
          6 / view.value.scale
        )
      : { dx: 0, dy: 0, guides: [] }
    guides.value = aligned.guides

    const onX = aligned.guides.some((g) => g.orientation === 'v')
    const onY = aligned.guides.some((g) => g.orientation === 'h')
    editAfter = free.map((m) => {
      const snapped = grid.find((g) => g.id === m.id)!
      return {
        id: m.id,
        x: onX ? m.x + aligned.dx : snapped.x,
        y: onY ? m.y + aligned.dy : snapped.y,
        ...sizeOf(m.id)
      }
    })

    emit('move', editAfter)
    return
  }
  if (!panning.value) return
  view.value = {
    ...view.value,
    x: view.value.x + (event.clientX - last.x),
    y: view.value.y + (event.clientY - last.y)
  }
  last = { x: event.clientX, y: event.clientY }
}

function onUp() {
  if (marquee.value) {
    const rect = marqueeRect(marquee.value.from, marquee.value.to)
    // 只有拖出了实际面积才当作框选：原地一点应当理解为「取消选中」
    if (rect.width > 4 && rect.height > 4) emit('update:selection', nodesInRect(props.nodes, rect))
    else emit('update:selection', [])
    marquee.value = null
    return
  }
  panning.value = false
  commitEdit()
  dragging.value = null
  resizing.value = null
  guides.value = []
}

/**
 * 一键排版。
 *
 * 走的是与手动拖动同一条 `move` 事件，因此能被撤销——一键把别人排了半天的图
 * 重排一遍，却撤不回去，那是把一个便利做成了事故。
 */
function layout() {
  if (props.readonly) return
  editBefore = geometryOf(props.nodes.map((n) => n.id))
  const laid = autoLayout(props.nodes, props.edges)
  editAfter = laid.map((n) => {
    const before = props.nodes.find((m) => m.id === n.id)
    return { id: n.id, x: n.x, y: n.y, width: before?.width, height: before?.height }
  })
  emit('move', editAfter)
  commitEdit()
}

function zoom(delta: number) {
  // 缩放范围收在 0.4~2：再小看不清字，再大不如直接看单个节点
  view.value = { ...view.value, scale: Math.min(2, Math.max(0.4, view.value.scale + delta)) }
}

function fit() {
  const rect = root.value?.getBoundingClientRect()
  const bounds = boundsOf(props.nodes)
  if (!rect || !bounds.width) return
  const scale = Math.min(2, Math.max(0.4, Math.min(rect.width / bounds.width, props.height / bounds.height)))
  view.value = {
    scale,
    x: rect.width / 2 - (bounds.x + bounds.width / 2) * scale,
    y: props.height / 2 - (bounds.y + bounds.height / 2) * scale
  }
}

/* ---------- 缩略图 ---------- */

const canvasSize = computed(() => ({
  width: root.value?.getBoundingClientRect().width ?? 640,
  height: props.height
}))

// 视图或节点一动缩略图就要跟着动，因此依赖 view 与 nodes 两者
const minimap = computed(() => minimapLayout(props.nodes, view.value, canvasSize.value, MINIMAP))

function onMinimapDown(event: PointerEvent) {
  const rect = (event.currentTarget as Element).getBoundingClientRect()
  view.value = viewFromMinimap(
    { x: event.clientX - rect.left, y: event.clientY - rect.top },
    minimap.value,
    view.value,
    canvasSize.value
  )
}

const minimapNode = (node: FlowNode) => ({
  x: node.x * minimap.value.scale + minimap.value.offsetX,
  y: node.y * minimap.value.scale + minimap.value.offsetY,
  width: (node.width ?? NODE_W) * minimap.value.scale,
  height: (node.height ?? NODE_H) * minimap.value.scale
})

/* ---------- 快照导出 ---------- */

/**
 * 导出当前图为 SVG 文件。
 *
 * 导出的是整张图而不是当前视口：按视口导出，用户拿到的文件会缺掉他没滚动到的
 * 部分，而他并不会察觉。工具条、选框、缩略图这些界面件也要摘掉——
 * 它们是编辑器的一部分，不是图的一部分。
 */
function exportSvg() {
  const source = svg.value
  if (!source) return
  const box = snapshotViewBox(props.nodes)
  const clone = source.cloneNode(true) as SVGSVGElement
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('viewBox', `${box.x} ${box.y} ${box.width} ${box.height}`)
  clone.setAttribute('width', String(Math.round(box.width)))
  clone.setAttribute('height', String(Math.round(box.height)))
  // 画布的平移缩放属于「我现在怎么看」，导出时要还原成图自身的坐标
  clone.querySelector('.i-flow__scene')?.removeAttribute('transform')
  clone.querySelector('.i-flow__marquee')?.remove()
  clone.querySelectorAll('.i-flow__handle').forEach((el) => el.remove())
  // 辅助线是拖动时的提示，不该出现在导出的图里
  clone.querySelectorAll('.i-flow__guide').forEach((el) => el.remove())

  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style')
  style.textContent = `${snapshotStyle(flatten())}\n${flowCss()}`
  clone.insertBefore(style, clone.firstChild)

  const blob = new Blob([new XMLSerializer().serializeToString(clone)], {
    type: 'image/svg+xml;charset=utf-8'
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${props.exportName}.svg`
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * 把页面里 .i-flow 相关的规则抄进导出文件。
 *
 * 不这样做就得在这里再写一份样式，两份迟早分叉：页面上改了描边粗细，
 * 导出的文件还是旧的，而且没有任何检查会发现。
 */
function flowCss() {
  const out: string[] = []
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList
    try {
      rules = sheet.cssRules
    } catch {
      // 跨域样式表读不到 cssRules，跳过即可——图的样式都在本地表里
      continue
    }
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule && rule.selectorText.includes('.i-flow__')) {
        out.push(rule.cssText)
      }
    }
  }
  return out.join('\n')
}

/*
 * 挂载时先适应画布：自动布局出来的图往往比画布高，
 * 不做这一步用户打开看到的就只有第一个节点，还以为图坏了。
 */
onMounted(async () => {
  await nextTick()
  fit()
})

// 节点数量变化（增删）时重新适应；只是拖动位置就不打扰用户的视角
watch(() => props.nodes.length, async () => {
  await nextTick()
  fit()
})

defineExpose({ fit, zoom, undo, redo, exportSvg })

const transform = computed(
  () => `translate(${view.value.x} ${view.value.y}) scale(${view.value.scale})`
)

const shapeOf = (node: FlowNode) => node.type ?? 'process'
const sizeOf = (node: FlowNode) => ({ w: node.width ?? NODE_W, h: node.height ?? NODE_H })

/** 判断节点画成菱形：四个顶点 */
function diamondPoints(node: FlowNode) {
  const { w, h } = sizeOf(node)
  return `${node.x + w / 2},${node.y} ${node.x + w},${node.y + h / 2} ${node.x + w / 2},${node.y + h} ${node.x},${node.y + h / 2}`
}

/** 缩放手柄只在「恰好选中一个节点」时出现：多选时拖角改的是哪一个并不清楚 */
const resizeTarget = computed(() =>
  !props.readonly && props.selection.length === 1
    ? nodeById.value.get(props.selection[0]) ?? null
    : null
)

const handlesOf = (node: FlowNode) => {
  const { w, h } = sizeOf(node)
  return [
    { handle: 'nw' as const, x: node.x, y: node.y, cursor: 'nwse-resize' },
    { handle: 'ne' as const, x: node.x + w, y: node.y, cursor: 'nesw-resize' },
    { handle: 'se' as const, x: node.x + w, y: node.y + h, cursor: 'nwse-resize' },
    { handle: 'sw' as const, x: node.x, y: node.y + h, cursor: 'nesw-resize' }
  ]
}

const marqueeBox = computed(() => (marquee.value ? marqueeRect(marquee.value.from, marquee.value.to) : null))

const pathOf = (edge: FlowEdge) => {
  const from = nodeById.value.get(edge.from)
  const to = nodeById.value.get(edge.to)
  return from && to ? edgePath(from, to, edge.type ?? props.edgeType) : ''
}

const midOf = (edge: FlowEdge) => {
  const from = nodeById.value.get(edge.from)
  const to = nodeById.value.get(edge.to)
  return from && to ? edgeMidpoint(from, to, edge.type ?? props.edgeType) : { x: 0, y: 0 }
}

/** 与选中节点相连的线加重：看清「它从哪来、到哪去」是选中节点后的第一个问题 */
const isActive = (edge: FlowEdge) =>
  selectedSet.value.has(edge.from) || selectedSet.value.has(edge.to)
</script>

<template>
  <!-- tabindex 让画布能接到键盘：快捷键绑在画布上，不劫持页面其他地方的撤销 -->
  <div
    ref="root"
    class="i-flow"
    :class="{ 'is-panning': panning, 'is-marquee': marqueeMode }"
    :style="{ height: `${height}px` }"
    tabindex="0"
    @keydown="onKeydown"
  >
    <svg
      ref="svg"
      class="i-flow__canvas"
      :height="height"
      @pointerdown="onDown"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointercancel="onUp"
    >
      <defs>
        <marker id="i-flow-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0 0 L8 4 L0 8 z" fill="var(--i-color-border-strong)" />
        </marker>
        <marker id="i-flow-arrow-active" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0 0 L8 4 L0 8 z" fill="var(--i-color-brand)" />
        </marker>
      </defs>

      <g class="i-flow__scene" :transform="transform">
        <g v-for="edge in edges" :key="`${edge.from}-${edge.to}`">
          <path
            class="i-flow__edge"
            :class="{ 'is-active': isActive(edge) }"
            :d="pathOf(edge)"
            :marker-end="`url(#i-flow-arrow${isActive(edge) ? '-active' : ''})`"
          />
          <template v-if="edge.label">
            <!-- 标签底下垫一块底色：不垫的话线会从字中间穿过去 -->
            <rect
              class="i-flow__edge-label-bg"
              :x="midOf(edge).x - edge.label.length * 6 - 2"
              :y="midOf(edge).y - 8"
              :width="edge.label.length * 12 + 4"
              height="16"
              rx="3"
            />
            <text class="i-flow__edge-label" :x="midOf(edge).x" :y="midOf(edge).y + 4" text-anchor="middle">
              {{ edge.label }}
            </text>
          </template>
        </g>

        <g
          v-for="node in nodes"
          :key="node.id"
          class="i-flow__node"
          :class="[`i-flow__node--${shapeOf(node)}`, { 'is-selected': selectedSet.has(node.id) }]"
          @pointerdown="onNodeDown($event, node)"
        >
          <polygon v-if="shapeOf(node) === 'decision'" class="i-flow__shape" :points="diamondPoints(node)" />
          <rect
            v-else
            class="i-flow__shape"
            :x="node.x"
            :y="node.y"
            :width="sizeOf(node).w"
            :height="sizeOf(node).h"
            :rx="shapeOf(node) === 'start' || shapeOf(node) === 'end' ? sizeOf(node).h / 2 : 8"
          />
          <text
            class="i-flow__label"
            :x="node.x + sizeOf(node).w / 2"
            :y="node.y + sizeOf(node).h / 2 + 4"
            text-anchor="middle"
          >
            {{ node.label }}
          </text>
        </g>

        <!-- 缩放手柄画在所有节点之上：压在下面会被相邻节点盖住，抓不到 -->
        <rect
          v-for="h in resizeTarget ? handlesOf(resizeTarget) : []"
          :key="h.handle"
          class="i-flow__handle"
          :x="h.x - 4"
          :y="h.y - 4"
          width="8"
          height="8"
          rx="2"
          :style="{ cursor: h.cursor }"
          @pointerdown="onHandleDown($event, resizeTarget, h.handle)"
        />

        <rect
          v-if="marqueeBox"
          class="i-flow__marquee"
          :x="marqueeBox.x"
          :y="marqueeBox.y"
          :width="marqueeBox.width"
          :height="marqueeBox.height"
        />

        <!--
          对齐辅助线。只在拖动过程中出现，松手即消失——它是操作时的提示，
          不是图的一部分，留在画布上会被当成一条真的连线。
        -->
        <line
          v-for="(guide, index) in guides"
          :key="index"
          class="i-flow__guide"
          :x1="guide.orientation === 'v' ? guide.at : guide.from"
          :y1="guide.orientation === 'v' ? guide.from : guide.at"
          :x2="guide.orientation === 'v' ? guide.at : guide.to"
          :y2="guide.orientation === 'v' ? guide.to : guide.at"
        />
      </g>
    </svg>

    <!--
      缩略图：整张图的缩小版加一个取景框。点哪里就跳到哪里——
      大图里这是唯一比拖滚动条快的导航方式。
    -->
    <div v-if="showMinimap" class="i-flow__minimap" @pointerdown="onMinimapDown">
      <svg :width="MINIMAP.width" :height="MINIMAP.height" aria-hidden="true">
        <rect
          v-for="node in nodes"
          :key="node.id"
          class="i-flow__minimap-node"
          :class="{ 'is-selected': selectedSet.has(node.id) }"
          v-bind="minimapNode(node)"
          rx="1"
        />
        <rect
          class="i-flow__minimap-viewport"
          :x="minimap.viewport.x"
          :y="minimap.viewport.y"
          :width="minimap.viewport.width"
          :height="minimap.viewport.height"
        />
      </svg>
    </div>

    <div v-if="!readonly" class="i-flow__toolbar i-flow__toolbar--history">
      <button class="i-flow__tool" aria-label="自动布局" @click="layout">
        <IIcon name="layers" :size="14" />
      </button>
      <button class="i-flow__tool" aria-label="撤销" :disabled="!canUndo" @click="undo">
        <IIcon name="undo" :size="14" />
      </button>
      <button class="i-flow__tool" aria-label="重做" :disabled="!canRedo" @click="redo">
        <IIcon name="redo" :size="14" />
      </button>
    </div>

    <div class="i-flow__toolbar">
      <button
        v-if="!readonly"
        class="i-flow__tool"
        :class="{ 'is-on': marqueeMode }"
        :aria-pressed="String(marqueeMode)"
        aria-label="框选（或按住 Shift 拖动）"
        @click="marqueeMode = !marqueeMode"
      >
        <IIcon name="marquee" :size="14" />
      </button>
      <button
        class="i-flow__tool"
        :class="{ 'is-on': showMinimap }"
        :aria-pressed="String(showMinimap)"
        aria-label="缩略图"
        @click="showMinimap = !showMinimap"
      >
        <IIcon name="minimap" :size="14" />
      </button>
      <button class="i-flow__tool" aria-label="导出 SVG" @click="exportSvg">
        <IIcon name="download" :size="14" />
      </button>
      <button class="i-flow__tool" aria-label="缩小" @click="zoom(-0.2)"><IIcon name="minus" :size="14" /></button>
      <span class="i-flow__zoom">{{ Math.round(view.scale * 100) }}%</span>
      <button class="i-flow__tool" aria-label="放大" @click="zoom(0.2)"><IIcon name="plus" :size="14" /></button>
      <button class="i-flow__tool" aria-label="适应画布" @click="fit"><IIcon name="grid" :size="14" /></button>
    </div>
  </div>
</template>
