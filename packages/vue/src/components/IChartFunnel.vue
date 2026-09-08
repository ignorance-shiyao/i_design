<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IChartFunnel.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { formatTick, funnelShapes } from '@i-design/common'

export interface FunnelStage {
  name: string
  value: number
}

const props = withDefaults(
  defineProps<{ stages: FunnelStage[]; title?: string; unit?: string; height?: number }>(),
  { title: '', unit: '', height: 240 }
)

const W = 420
const active = ref<number | null>(null)
const shapes = computed(() => funnelShapes(props.stages.map((s) => s.value), W, props.height))

/*
 * 漏斗的每一层用同一色相的不同深度，而不是八个分类色。
 * 漏斗的层级是有序的（先后环节），有序数据用单色阶——
 * 换成分类色会让读者以为各层之间是并列关系。
 */
const colorOf = (index: number) => `var(--i-chart-seq-${Math.min(5, index + 1)})`
</script>

<template>
  <figure class="i-chart">
    <figcaption v-if="title" class="i-chart__title">{{ title }}</figcaption>

    <div class="i-chart__funnel">
      <svg :viewBox="`0 0 ${W} ${height}`" :style="{ height: `${height}px` }" role="img" :aria-label="title || '漏斗图'">
        <polygon
          v-for="(shape, index) in shapes"
          :key="stages[index].name"
          :points="shape.points"
          :fill="colorOf(index)"
          stroke="var(--i-color-bg)"
          stroke-width="2"
          :opacity="active === null || active === index ? 1 : 0.6"
          @mouseenter="active = index"
          @mouseleave="active = null"
        />
      </svg>

      <!-- 数值与转化率写在右侧：写在梯形里，窄的那几层根本放不下 -->
      <ol class="i-chart__funnel-legend">
        <li
          v-for="(stage, index) in stages"
          :key="stage.name"
          :class="{ 'is-active': active === index }"
          @mouseenter="active = index"
          @mouseleave="active = null"
        >
          <span class="i-chart__swatch" :style="{ background: colorOf(index) }" />
          <span class="i-chart__funnel-name">{{ stage.name }}</span>
          <span class="i-chart__funnel-value">{{ formatTick(stage.value) }}{{ unit }}</span>
          <span class="i-chart__funnel-rate">
            {{ index === 0 ? '起点' : `较上一步 ${(shapes[index].step * 100).toFixed(1)}%` }}
          </span>
        </li>
      </ol>
    </div>
  </figure>
</template>
