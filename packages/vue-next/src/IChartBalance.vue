<script setup lang="ts">
import { computed } from 'vue'
import type { BalanceModel } from '@i-design/common'

const props = withDefaults(defineProps<{
  /** buildBalance 生成的同源模型，可直接序列化给其他端 */
  model: BalanceModel
  title?: string
  selectedId?: string
  rowHeight?: number
}>(), { title: '贡献', selectedId: '', rowHeight: 32 })
const emit = defineEmits<{ select: [id: string] }>()

/*
 * 横向的台阶图：每一项一行，柱子从上一项的累计画到自己的累计。
 *
 * 横着排而不是竖着排，是因为项目名是中文短语，竖排时名字只能斜着写或者省略；
 * 横排每一行的名字就在柱子左边，读起来不用来回对照。
 * 用 HTML 盒子而不是 SVG：行高与字号得是固定像素，否则窄屏上跟着整体缩。
 */
const span = computed(() => props.model.max - props.model.min || 1)
const pos = (value: number) => ((value - props.model.min) / span.value) * 100
const zero = computed(() => pos(0))

function bar(step: BalanceModel['steps'][number]) {
  const a = pos(Math.min(step.from, step.to))
  const b = pos(Math.max(step.from, step.to))
  return { insetInlineStart: `${a}%`, width: `${Math.max(b - a, 0.6)}%` }
}
</script>

<template>
  <figure class="i-balance">
    <figcaption class="i-balance__title">{{ title }}</figcaption>
    <p class="i-balance__caption">{{ model.caption }}</p>
    <template v-if="model.state === 'ready'">
      <ol class="i-balance__plot" :aria-label="`${title}：${model.caption}`">
        <li
          v-for="step in model.steps"
          :key="step.id"
          class="i-balance__row"
          :style="{ minHeight: `${rowHeight}px` }"
        >
          <button
            type="button"
            class="i-balance__pick"
            :class="{ 'is-selected': step.id === selectedId }"
            :aria-label="step.description"
            :aria-pressed="step.id === selectedId"
            @click="emit('select', step.id)"
          >
            <span class="i-balance__label">{{ step.label }}</span>
            <span class="i-balance__track">
              <!-- 零线要画出来：负的那一段从哪儿开始，看的就是它 -->
              <span class="i-balance__zero" :style="{ insetInlineStart: `${zero}%` }" aria-hidden="true" />
              <span
                class="i-balance__bar"
                :class="[`is-${step.kind}`, `is-${step.direction}`]"
                :style="bar(step)"
              />
            </span>
            <span class="i-balance__value">{{ step.valueText }}</span>
            <span class="i-balance__cumulative">{{ step.cumulativeText }}</span>
          </button>
        </li>
      </ol>
      <p class="i-balance__caption">
        柱子从上一项的累计画起；右边两列是本项的增减与之后的累计。坐标轴含 0，负的那一段画在零线左边。
      </p>
    </template>
    <ul v-if="model.excluded.length" class="i-balance__issues" aria-label="未计入的项目">
      <li v-for="row in model.excluded" :key="row.id">源行 {{ row.sourceIndex + 1 }} · {{ row.label }}：{{ row.reason }}</li>
    </ul>
  </figure>
</template>
