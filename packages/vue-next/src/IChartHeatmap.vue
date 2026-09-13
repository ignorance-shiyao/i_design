<script setup lang="ts">
import { computed, ref } from 'vue'
import { formatTick, heatLevel } from '@i-design/common'

const props = withDefaults(
  defineProps<{
    /** 行 × 列的二维数值 */
    matrix: number[][]
    rows: string[]
    columns: string[]
    title?: string
    unit?: string
  }>(),
  { title: '', unit: '' }
)

const flat = computed(() => props.matrix.flat())
const min = computed(() => Math.min(...flat.value))
const max = computed(() => Math.max(...flat.value))

const active = ref<{ r: number; c: number } | null>(null)

/*
 * 单色阶而不是彩虹：热力图编码的是量级，
 * 彩虹会让读者以为不同颜色代表不同类别，而不是"多与少"。
 */
const colorOf = (value: number) => `var(--i-chart-seq-${heatLevel(value, min.value, max.value, 5) + 1})`

// 深色格子上用反色文字，浅色格子上用正常文字，保证任何一格的数字都读得出来
/*
 * 格子里的字用与底色配套的 `-ink` 令牌，而不是按档位硬判。
 *
 * 按档位判断的前提是「档位越高底色越深」，而暗色主题的色阶方向是反的——
 * 于是浅蓝格子上写浅色字，实测只有 1.57:1，数字基本看不见。
 * `-ink` 是生成令牌时用 contrastText 按每一档的实际颜色算出来的，
 * 底色换了它跟着换，不存在对不上的可能。
 */
const textOf = (value: number) =>
  `var(--i-chart-seq-${heatLevel(value, min.value, max.value, 5) + 1}-ink)`
</script>

<template>
  <figure class="i-chart">
    <figcaption v-if="title" class="i-chart__title">{{ title }}</figcaption>

    <div class="i-chart__heat">
      <table class="i-chart__heat-grid">
        <thead>
          <tr>
            <th />
            <th v-for="column in columns" :key="column">{{ column }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, r) in rows" :key="row">
            <th>{{ row }}</th>
            <td
              v-for="(value, c) in matrix[r]"
              :key="`${r}-${c}`"
              :style="{ background: colorOf(value), color: textOf(value) }"
              :class="{ 'is-active': active?.r === r && active?.c === c }"
              @mouseenter="active = { r, c }"
              @mouseleave="active = null"
            >
              {{ formatTick(value) }}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 图例说明色深对应的量级；没有它，颜色只是好看而不可读 -->
      <div class="i-chart__heat-scale">
        <span>{{ formatTick(min) }}{{ unit }}</span>
        <span v-for="step in 5" :key="step" class="i-chart__heat-swatch" :style="{ background: `var(--i-chart-seq-${step})` }" />
        <span>{{ formatTick(max) }}{{ unit }}</span>
      </div>
    </div>
  </figure>
</template>
