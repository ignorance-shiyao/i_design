<script setup lang="ts">
import { computed, ref } from 'vue'
import { polygonPath, radarPoints } from '@i-design/common'

export interface RadarSeries {
  name: string
  /** 与 axes 一一对应 */
  data: number[]
}

const props = withDefaults(
  defineProps<{
    axes: string[]
    series: RadarSeries[]
    /** 各维度的满分；不传则取数据最大值 */
    max?: number
    size?: number
    title?: string
  }>(),
  { max: 0, size: 240, title: '' }
)

/*
 * 半径要给维度名让位：标签沿轴向外排布，留 28px 时最右侧的名字会被画布裁掉。
 * 这里按最长维度名估宽（中文按每字 12px），保证任何一个都完整。
 */
const radius = computed(() => {
  const longest = Math.max(4, ...props.axes.map((a) => a.length))
  const reserve = Math.min(props.size * 0.28, longest * 12)
  return props.size / 2 - reserve - 12
})
const maxValue = computed(
  () => props.max || Math.max(1, ...props.series.flatMap((s) => s.data))
)
const rings = [0.25, 0.5, 0.75, 1]
const hidden = ref<Set<string>>(new Set())
const visible = computed(() => props.series.filter((s) => !hidden.value.has(s.name)))

const colorOf = (name: string) =>
  `var(--i-chart-${(props.series.findIndex((s) => s.name === name) % 8) + 1})`

const pointsOf = (data: number[]) => radarPoints(data, maxValue.value, radius.value)

/**
 * 维度名的位置与对齐方式。
 *
 * 一律居中会让最右侧的标签超出画布被裁掉——按它在圆周上的位置决定对齐：
 * 右半边左对齐、左半边右对齐、正上正下才居中。
 */
const labelAt = (index: number) => {
  const angle = -Math.PI / 2 + (index / props.axes.length) * Math.PI * 2
  const x = props.size / 2 + (radius.value + 14) * Math.cos(angle)
  const y = props.size / 2 + (radius.value + 14) * Math.sin(angle)
  const anchor = Math.abs(Math.cos(angle)) < 0.2 ? 'middle' : Math.cos(angle) > 0 ? 'start' : 'end'
  return { x, y: y + 4, anchor }
}
const axisPoints = computed(() => radarPoints(props.axes.map(() => maxValue.value), maxValue.value, radius.value))

function toggle(name: string) {
  const next = new Set(hidden.value)
  if (next.has(name)) next.delete(name)
  else if (props.series.length - next.size > 1) next.add(name)
  hidden.value = next
}
</script>

<template>
  <figure class="i-chart">
    <figcaption v-if="title" class="i-chart__title">{{ title }}</figcaption>

    <div class="i-chart__radar">
      <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`" role="img" :aria-label="title || '雷达图'">
        <g :transform="`translate(${size / 2 - radius} ${size / 2 - radius})`">
          <!-- 蛛网：等分的同心多边形，比同心圆更容易读出「落在第几档」 -->
          <path
            v-for="ring in rings"
            :key="ring"
            :d="polygonPath(radarPoints(axes.map(() => maxValue * ring), maxValue, radius))"
            fill="none"
            stroke="var(--i-color-hairline)"
          />
          <line
            v-for="(point, index) in axisPoints"
            :key="`axis-${index}`"
            :x1="radius"
            :y1="radius"
            :x2="point.axisX"
            :y2="point.axisY"
            stroke="var(--i-color-hairline)"
          />

          <g v-for="s in visible" :key="s.name">
            <!--
              多个系列时只描边不填充：两层半透明填充叠在一起是混合色，
              读者没法把色块对回图例；单系列时填充能让形状更好读，所以保留。
            -->
            <path
              :d="polygonPath(pointsOf(s.data))"
              :fill="visible.length > 1 ? 'none' : colorOf(s.name)"
              fill-opacity="0.18"
              :stroke="colorOf(s.name)"
              stroke-width="2"
              stroke-linejoin="round"
            />
            <circle
              v-for="(point, index) in pointsOf(s.data)"
              :key="`${s.name}-${index}`"
              :cx="point.x"
              :cy="point.y"
              r="3"
              :fill="colorOf(s.name)"
            />
          </g>
        </g>

        <!-- 维度名放在轴的外侧，避免压住数据多边形 -->
        <text
          v-for="(axis, index) in axes"
          :key="axis"
          class="i-chart__tick"
          :x="labelAt(index).x"
          :y="labelAt(index).y"
          :text-anchor="labelAt(index).anchor"
        >
          {{ axis }}
        </text>
      </svg>
    </div>

    <div v-if="series.length > 1" class="i-chart__legend">
      <button
        v-for="s in series"
        :key="s.name"
        class="i-chart__legend-item"
        :class="{ 'is-off': hidden.has(s.name) }"
        @click="toggle(s.name)"
      >
        <span class="i-chart__swatch" :style="{ background: colorOf(s.name) }" />
        {{ s.name }}
      </button>
    </div>
  </figure>
</template>
