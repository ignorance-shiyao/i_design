<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/IPagination.vue 转换而来。
  差异仅在 Vue 2 的语法约束（v-model 用 value/input、模板需单根），行为保持一致。
-->
<script setup lang="ts">
import { computed } from 'vue'
import IIcon from './IIcon.vue'

const props = withDefaults(
  defineProps<{
    /** 当前页码，从 1 开始 */
    value?: number
    total: number
    pageSize?: number
    /** 中间连续页码的最大个数，不含首尾页与省略号 */
    maxVisible?: number
    size?: 'sm' | 'md'
    disabled?: boolean
    showTotal?: boolean
  }>(),
  { value: 1, pageSize: 10, maxVisible: 5, size: 'md', disabled: false, showTotal: true }
)

const emit = defineEmits<{ (e: 'input', a0: number): void; (e: 'change', a0: number): void }>()

const pageCount = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))
const current = computed(() => Math.min(Math.max(1, props.value), pageCount.value))

/**
 * 页码序列：始终保留首尾页，中间窗口跟随当前页滑动，
 * 断开处以 'left' / 'right' 省略号占位（用字符串区分，便于模板判断）。
 */
const items = computed<(number | 'left' | 'right')[]>(() => {
  const count = pageCount.value
  const window = Math.max(1, props.maxVisible)
  if (count <= window + 2) {
    return Array.from({ length: count }, (_, i) => i + 1)
  }

  const half = Math.floor(window / 2)
  let start = Math.max(2, current.value - half)
  let end = start + window - 1
  if (end >= count) {
    end = count - 1
    start = Math.max(2, end - window + 1)
  }

  const result: (number | 'left' | 'right')[] = [1]
  if (start > 2) result.push('left')
  for (let i = start; i <= end; i++) result.push(i)
  if (end < count - 1) result.push('right')
  result.push(count)
  return result
})

const rangeText = computed(() => {
  if (!props.total) return '共 0 条'
  const from = (current.value - 1) * props.pageSize + 1
  const to = Math.min(current.value * props.pageSize, props.total)
  return `第 ${from}-${to} 条 / 共 ${props.total} 条`
})

function go(page: number) {
  if (props.disabled) return
  const next = Math.min(Math.max(1, page), pageCount.value)
  if (next === current.value) return
  emit('input', next)
  emit('change', next)
}

/** 省略号一次跳跃一个窗口，比逐页点击快得多 */
function jump(direction: 'left' | 'right') {
  go(current.value + (direction === 'left' ? -props.maxVisible : props.maxVisible))
}
</script>

<template>
  <nav class="i-pagination" :class="[`i-pagination--${size}`, { 'is-disabled': disabled }]" aria-label="分页">
    <span v-if="showTotal" class="i-pagination__total">{{ rangeText }}</span>

    <button
      class="i-pagination__item"
      type="button"
      aria-label="上一页"
      :disabled="disabled || current === 1"
      @click="go(current - 1)"
    >
      <IIcon name="chevron-left" :size="15" />
    </button>

    <template v-for="(item, index) in items" :key="`${item}-${index}`">
      <button
        v-if="typeof item === 'number'"
        class="i-pagination__item"
        :class="{ 'is-active': item === current }"
        type="button"
        :aria-current="item === current ? 'page' : undefined"
        :aria-label="`第 ${item} 页`"
        :disabled="disabled"
        @click="go(item)"
      >
        {{ item }}
      </button>
      <button
        v-else
        class="i-pagination__item i-pagination__ellipsis"
        type="button"
        :aria-label="item === 'left' ? `向前 ${maxVisible} 页` : `向后 ${maxVisible} 页`"
        :disabled="disabled"
        @click="jump(item)"
      >
        <IIcon name="more" :size="15" />
      </button>
    </template>

    <button
      class="i-pagination__item"
      type="button"
      aria-label="下一页"
      :disabled="disabled || current === pageCount"
      @click="go(current + 1)"
    >
      <IIcon name="chevron-right" :size="15" />
    </button>
  </nav>
</template>
