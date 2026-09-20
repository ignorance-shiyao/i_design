<script setup lang="ts">
import { computed } from 'vue'
import { CHART_PALETTE_SIZE, hierarchyView, sunburstSectors, type HierarchyModel } from '@i-design/common'

const props = withDefaults(defineProps<{
  /** buildHierarchy 生成的同源模型，可直接序列化给其他端 */
  model: HierarchyModel
  title?: string
  /** 下钻焦点；为空表示看整棵树。受控，由调用方决定怎么变 */
  focusId?: string
  selectedId?: string
  size?: number
}>(), { title: '旭日图', focusId: '', selectedId: '', size: 220 })
const emit = defineEmits<{ select: [id: string]; focus: [id: string] }>()

const view = computed(() => hierarchyView(props.model, props.focusId || null))
const sectors = computed(() => sunburstSectors(view.value, { size: props.size }))
const focusPath = computed(() =>
  props.focusId ? props.model.nodes.filter(node => node.id === props.focusId) : []
)
const centerText = computed(() =>
  focusPath.value.length ? focusPath.value[0].valueText : props.model.totalText
)
</script>

<template>
  <figure class="i-sunburst">
    <figcaption class="i-sunburst__title">{{ title }}</figcaption>
    <p class="i-sunburst__caption">{{ model.caption }}</p>
    <template v-if="model.state === 'ready'">
      <p v-if="focusId" class="i-sunburst__crumb">
        <button type="button" class="i-sunburst__up" @click="emit('focus', '')">返回全部</button>
        <span>当前只看：{{ focusPath[0]?.label }}</span>
      </p>
      <svg
        class="i-sunburst__plot"
        :viewBox="`0 0 ${size} ${size}`"
        :style="{ width: `${size}px`, height: `${size}px` }"
        role="img"
        :aria-label="`${title}。${model.caption}。下方可按层级选择并读取数据。`"
      >
        <path
          v-for="sector in sectors"
          :key="sector.id"
          :d="sector.path"
          class="i-sunburst__sector"
          :class="[sector.colorIndex < CHART_PALETTE_SIZE ? `is-c${sector.colorIndex}` : 'is-over', { 'is-rest': sector.kind === 'rest', 'is-selected': sector.id === selectedId }]"
          @click="emit('select', sector.id)"
          @dblclick="emit('focus', sector.id)"
        ><title>{{ sector.description }}</title></path>
        <text class="i-sunburst__center" :x="size / 2" :y="size / 2">{{ centerText }}</text>
      </svg>
      <p class="i-sunburst__caption">
        内圈是上级，外圈是它的下级；同一支各层同色。占比同时给出占全体与占上级两种分母。
      </p>
    </template>
    <ol class="i-sunburst__data" aria-label="层级数据">
      <li v-for="node in view" :key="node.id" :style="{ paddingInlineStart: `${node.depth * 16}px` }">
        <button
          type="button"
          class="i-sunburst__row"
          :aria-label="node.description"
          :aria-pressed="selectedId === node.id"
          @click="emit('select', node.id)"
        >
          <span>{{ node.label }}{{ selectedId === node.id ? ' · 已选' : '' }}</span>
          <span class="i-sunburst__values">
            {{ node.valueText }} · 占全体 {{ node.shareText }}<template v-if="node.shareOfParent !== null"> · 占上级 {{ (node.shareOfParent * 100).toFixed(1) }}%</template> · 源行 {{ node.sourceIndex + 1 }}
          </span>
        </button>
      </li>
    </ol>
    <ul v-if="model.excluded.length" class="i-sunburst__issues" aria-label="未计入的节点">
      <li v-for="row in model.excluded" :key="row.id">源行 {{ row.sourceIndex + 1 }} · {{ row.label }}：{{ row.reason }}</li>
    </ul>
  </figure>
</template>
