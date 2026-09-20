<script setup lang="ts">
import { computed } from 'vue'
import {
  CHART_PALETTE_SIZE,
  hierarchyView,
  icicleCells,
  type HierarchyModel
} from '@i-design/common'

const props = withDefaults(defineProps<{
  /** buildHierarchy 生成的同源模型，可直接序列化给其他端 */
  model: HierarchyModel
  title?: string
  /** 下钻焦点；为空表示看整棵树。受控，由调用方决定怎么变 */
  focusId?: string
  selectedId?: string
  rowHeight?: number
}>(), { title: 'Icicle 图', focusId: '', selectedId: '', rowHeight: 28 })
const emit = defineEmits<{ select: [id: string]; focus: [id: string] }>()

/*
 * 用 HTML 盒子而不是 SVG。
 *
 * SVG 要靠 viewBox 适配宽度，而 viewBox 是整体缩放：窄屏上宽度缩到三分之一，
 * 行高和格子里的字跟着缩到三分之一——实测 320px 下整张图只剩 31px 高，
 * 字小到读不出来（check:responsive 的 9px 下限正是为这个设的）。
 * 换成盒子之后，宽度按百分比分配、行高是固定的 CSS 像素，字也还是正文的字。
 *
 * 排版用格子的百分比那一组；像素那一组仍按一个标称宽度算，
 * 「这一格写不写得下名字」就是按它估的。
 */
const WIDTH = 640
const view = computed(() => hierarchyView(props.model, props.focusId || null))
const cells = computed(() => icicleCells(view.value, { width: WIDTH, rowHeight: props.rowHeight }))
const rows = computed(() => Math.max(0, ...cells.value.map(cell => cell.depth + 1)))
const focused = computed(() => props.model.nodes.find(node => node.id === props.focusId))

const colorClass = (colorIndex: number, kind: string) =>
  kind === 'rest' ? 'is-rest' : colorIndex < CHART_PALETTE_SIZE ? `is-c${colorIndex}` : 'is-over'
</script>

<template>
  <figure class="i-icicle">
    <figcaption class="i-icicle__title">{{ title }}</figcaption>
    <p class="i-icicle__caption">{{ model.caption }}</p>
    <template v-if="model.state === 'ready'">
      <p v-if="focusId" class="i-icicle__crumb">
        <button type="button" class="i-icicle__up" @click="emit('focus', '')">返回全部</button>
        <span>当前只看：{{ focused?.label }}（{{ focused?.valueText }}）</span>
      </p>
      <div
        class="i-icicle__plot"
        :style="{ height: `${rows * rowHeight}px` }"
        role="img"
        :aria-label="`${title}。${model.caption}。下方可按层级选择并读取数据。`"
      >
        <div
          v-for="cell in cells"
          :key="cell.id"
          class="i-icicle__cell"
          :class="[colorClass(cell.colorIndex, cell.kind), { 'is-selected': cell.id === selectedId }]"
          :style="{ insetInlineStart: `${cell.xPercent}%`, width: `${cell.widthPercent}%`, top: `${cell.y}px`, height: `${cell.height}px` }"
          :title="cell.description"
          @click="emit('select', cell.id)"
          @dblclick="emit('focus', cell.id)"
        >
          <span v-if="cell.labelFits" class="i-icicle__label">{{ cell.label }}</span>
        </div>
      </div>
      <p class="i-icicle__caption">
        每一行是一层，上一行是下一行的上级；宽度按占全体的比例分配，同一支各层同色。
      </p>
    </template>
    <ol class="i-icicle__data" aria-label="层级数据">
      <li v-for="node in view" :key="node.id" :style="{ paddingInlineStart: `${node.depth * 16}px` }">
        <button
          type="button"
          class="i-icicle__row"
          :aria-label="node.description"
          :aria-pressed="selectedId === node.id"
          @click="emit('select', node.id)"
        >
          <span>{{ node.label }}{{ selectedId === node.id ? ' · 已选' : '' }}</span>
          <span class="i-icicle__values">
            {{ node.valueText }} · 占全体 {{ node.shareText }}<template v-if="node.shareOfParent !== null"> · 占上级 {{ (node.shareOfParent * 100).toFixed(1) }}%</template> · 源行 {{ node.sourceIndex + 1 }}
          </span>
        </button>
      </li>
    </ol>
    <ul v-if="model.excluded.length" class="i-icicle__issues" aria-label="未计入的节点">
      <li v-for="row in model.excluded" :key="row.id">源行 {{ row.sourceIndex + 1 }} · {{ row.label }}：{{ row.reason }}</li>
    </ul>
  </figure>
</template>
