<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IQrcode.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
import { computed } from 'vue'
import { qrMatrix, qrPath, type QrEcLevel } from '@i-design/common'

const props = withDefaults(
  defineProps<{
    value: string
    /** 边长（px），不含静默区 */
    size?: number
    /** 纠错等级。加了中心图标就要提到 Q 或 H，否则遮住的部分无法恢复 */
    level?: QrEcLevel
    /** 码点颜色。默认纯黑：中等明度的颜色会让对比度掉到扫不出来 */
    color?: string
    background?: string
    /** 码下方的说明文字 */
    label?: string
  }>(),
  { size: 160, level: 'M', color: '#000000', background: '#ffffff', label: '' }
)

/* 静默区四个模块，规范给的下限。留白不够时相机会把旁边的文字当成模块 */
const QUIET = 4

const matrix = computed(() => qrMatrix(props.value, props.level))
const path = computed(() => (matrix.value ? qrPath(matrix.value) : ''))
const viewBox = computed(() => {
  if (!matrix.value) return '0 0 0 0'
  const side = matrix.value.size + QUIET * 2
  return `${-QUIET} ${-QUIET} ${side} ${side}`
})
</script>

<template>
  <div class="i-qrcode">
    <!--
      整张码画成一条 path 而不是每个模块一个 rect：
      版本 10 有三千多个模块，三千多个节点在长列表里会直接卡住，
      而一条 path 的渲染代价与模块数无关。
    -->
    <svg
      v-if="matrix"
      class="i-qrcode__canvas"
      :width="size"
      :height="size"
      :viewBox="viewBox"
      :style="{ background }"
      role="img"
      :aria-label="label || `二维码：${value}`"
    >
      <path :d="path" :fill="color" />
    </svg>

    <div v-else class="i-qrcode__error">
      内容过长，超出二维码容量（最多版本 {{ 10 }}）。<br />
      请改用更短的链接，或降低纠错等级。
    </div>

    <span v-if="label" class="i-qrcode__label">{{ label }}</span>
  </div>
</template>
