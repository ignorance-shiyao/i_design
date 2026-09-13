<script setup lang="ts">
import { useConfig } from './useConfig'
import { computed, ref } from 'vue'
import { formatTick, pieSlices } from '@i-design/common'

/* 文案走字典：图表的数据表是它的无障碍出口，按钮与表头也得跟着换语言 */
const { locale } = useConfig()

export interface PieItem {
  name: string
  value: number
}

const props = withDefaults(
  defineProps<{
    items: PieItem[]
    /** 环形：读者比较的是弧长而不是面积，比实心饼更容易读准 */
    donut?: boolean
    size?: number
    title?: string
    /** 环心文案，仅环形有效 */
    centerLabel?: string
    unit?: string
  }>(),
  { donut: true, size: 200, title: '', centerLabel: '', unit: '' }
)

const active = ref<number | null>(null)
const showTable = ref(false)

const radius = computed(() => props.size / 2)
const inner = computed(() => (props.donut ? radius.value * 0.62 : 0))
const slices = computed(() =>
  pieSlices(props.items.map((i) => i.value), radius.value, inner.value, {
    x: radius.value,
    y: radius.value
  })
)
const total = computed(() => props.items.reduce((sum, i) => sum + Math.max(0, i.value), 0))
const colorOf = (index: number) => `var(--i-chart-${(index % 8) + 1})`
</script>

<template>
  <figure class="i-chart i-chart--pie">
    <figcaption v-if="title" class="i-chart__title">{{ title }}</figcaption>

    <div class="i-chart__pie">
      <svg
        :width="size"
        :height="size"
        :viewBox="`0 0 ${size} ${size}`"
        role="img"
        :aria-label="title || '占比图'"
      >
        <path
          v-for="(slice, index) in slices"
          :key="items[index].name"
          class="i-chart__slice"
          :d="slice.path"
          :fill="colorOf(index)"
          :opacity="active === null || active === index ? 1 : 0.5"
          @mouseenter="active = index"
          @mouseleave="active = null"
        />
        <!-- 环心放总量：占比图最常被追问的就是「一共多少」 -->
        <text
          v-if="donut"
          class="i-chart__center"
          :x="radius"
          :y="radius - 2"
          text-anchor="middle"
        >
          {{ active === null ? formatTick(total) : formatTick(items[active].value) }}{{ unit }}
        </text>
        <text
          v-if="donut && (centerLabel || active !== null)"
          class="i-chart__center-label"
          :x="radius"
          :y="radius + 16"
          text-anchor="middle"
        >
          {{ active === null ? centerLabel : items[active].name }}
        </text>
      </svg>

      <!-- 占比图的图例同时承担数值标注：扇区上直接写数字会互相压 -->
      <ul class="i-chart__pie-legend">
        <li
          v-for="(item, index) in items"
          :key="item.name"
          :class="{ 'is-active': active === index }"
          @mouseenter="active = index"
          @mouseleave="active = null"
        >
          <span class="i-chart__swatch" :style="{ background: colorOf(index) }" />
          <span class="i-chart__pie-name">{{ item.name }}</span>
          <span class="i-chart__pie-value">
            {{ formatTick(item.value) }}{{ unit }}
            <em>{{ ((slices[index]?.percent ?? 0) * 100).toFixed(1) }}%</em>
          </span>
        </li>
      </ul>
    </div>

    <button class="i-chart__table-toggle" @click="showTable = !showTable">
      {{ showTable ? locale.chartTableHide : locale.chartTableShow }}
    </button>
    <table v-if="showTable" class="i-chart__table">
      <thead>
        <tr><th>{{ locale.chartCategory }}</th><th>{{ locale.chartValue }}</th><th>{{ locale.chartPercent }}</th></tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in items" :key="`row-${item.name}`">
          <td>{{ item.name }}</td>
          <td>{{ formatTick(item.value) }}{{ unit }}</td>
          <td>{{ ((slices[index]?.percent ?? 0) * 100).toFixed(1) }}%</td>
        </tr>
      </tbody>
    </table>
  </figure>
</template>
