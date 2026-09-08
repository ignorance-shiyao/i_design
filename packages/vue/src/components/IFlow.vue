<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IFlow.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import IIcon from './IIcon.vue'
import {
  NODE_H,
  NODE_W,
  boundsOf,
  edgeMidpoint,
  edgePath,
  type FlowEdge,
  type FlowNode
} from '@i-design/common'

const props = withDefaults(
  defineProps<{
    nodes: FlowNode[]
    edges: FlowEdge[]
    height?: number
    /** 只读：仍可平移缩放与选中，但不能拖动节点 */
    readonly?: boolean
    selected?: string | null
  }>(),
  { height: 380, readonly: false, selected: null }
)

const emit = defineEmits<{ (e: 'update:selected', a0: string | null): void; (e: 'move', a0: { id: string; x: number; y: number }): void }>()

const view = ref({ x: 0, y: 0, scale: 1 })
const panning = ref(false)
const dragging = ref<{ id: string; dx: number; dy: number } | null>(null)
const root = ref<HTMLElement | null>(null)

const nodeById = computed(() => new Map(props.nodes.map((n) => [n.id, n])))

/** 屏幕坐标 → 画布坐标 */
function toCanvas(event: PointerEvent) {
  const rect = root.value?.getBoundingClientRect()
  if (!rect) return { x: 0, y: 0 }
  return {
    x: (event.clientX - rect.left - view.value.x) / view.value.scale,
    y: (event.clientY - rect.top - view.value.y) / view.value.scale
  }
}

function onNodeDown(event: PointerEvent, node: FlowNode) {
  event.stopPropagation()
  emit('update:selected', node.id)
  if (props.readonly) return
  const point = toCanvas(event)
  dragging.value = { id: node.id, dx: point.x - node.x, dy: point.y - node.y }
  ;(event.target as Element).setPointerCapture?.(event.pointerId)
}

function onDown(event: PointerEvent) {
  // 点空白处：取消选中并开始平移
  emit('update:selected', null)
  panning.value = true
  ;(event.currentTarget as Element).setPointerCapture(event.pointerId)
  last = { x: event.clientX, y: event.clientY }
}

let last = { x: 0, y: 0 }

function onMove(event: PointerEvent) {
  if (dragging.value) {
    const point = toCanvas(event)
    emit('move', {
      id: dragging.value.id,
      // 吸附到 8px 网格：手绘位置总是差几像素，对齐后整张图才显得整齐
      x: Math.round((point.x - dragging.value.dx) / 8) * 8,
      y: Math.round((point.y - dragging.value.dy) / 8) * 8
    })
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
  panning.value = false
  dragging.value = null
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

defineExpose({ fit, zoom })

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

const pathOf = (edge: FlowEdge) => {
  const from = nodeById.value.get(edge.from)
  const to = nodeById.value.get(edge.to)
  return from && to ? edgePath(from, to) : ''
}

const midOf = (edge: FlowEdge) => {
  const from = nodeById.value.get(edge.from)
  const to = nodeById.value.get(edge.to)
  return from && to ? edgeMidpoint(from, to) : { x: 0, y: 0 }
}

/** 与选中节点相连的线加重：看清「它从哪来、到哪去」是选中节点后的第一个问题 */
const isActive = (edge: FlowEdge) =>
  props.selected !== null && (edge.from === props.selected || edge.to === props.selected)
</script>

<template>
  <div ref="root" class="i-flow" :class="{ 'is-panning': panning }" :style="{ height: `${height}px` }">
    <svg
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

      <g :transform="transform">
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
          :class="[`i-flow__node--${shapeOf(node)}`, { 'is-selected': selected === node.id }]"
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
      </g>
    </svg>

    <div class="i-flow__toolbar">
      <button class="i-flow__tool" aria-label="缩小" @click="zoom(-0.2)"><IIcon name="minus" :size="14" /></button>
      <span class="i-flow__zoom">{{ Math.round(view.scale * 100) }}%</span>
      <button class="i-flow__tool" aria-label="放大" @click="zoom(0.2)"><IIcon name="plus" :size="14" /></button>
      <button class="i-flow__tool" aria-label="适应画布" @click="fit"><IIcon name="grid" :size="14" /></button>
    </div>
  </div>
</template>
