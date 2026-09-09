<!--
  由 packages/vue/scripts/convert.mjs 从 src/components/ISegmented.vue 转换而来。
  差异仅在 Vue 2 的语法约束，行为保持一致。
-->
<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'

export interface SegmentedOption {
  label: string
  value: string | number
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    value?: string | number | null
    options: SegmentedOption[]
    size?: 'md' | 'lg'
    block?: boolean
    disabled?: boolean
  }>(),
  { value: null, size: 'md', block: false, disabled: false }
)

const emit = defineEmits<{ (e: 'input', a0: string | number): void; (e: 'change', a0: string | number): void }>()

const root = ref<HTMLElement | null>(null)
const thumb = ref({ left: 0, width: 0 })

const activeIndex = computed(() => props.options.findIndex((o) => o.value === props.value))

/**
 * 滑块位置按选中项的实际尺寸量，而不是按「第 n 项 × 平均宽度」算：
 * 选项文字长短不一时，等分假设会让滑块与文字错位。
 */
async function measure() {
  await nextTick()
  const el = root.value?.querySelectorAll('.i-segmented__item')[activeIndex.value] as
    | HTMLElement
    | undefined
  if (!el) {
    thumb.value = { left: 0, width: 0 }
    return
  }
  thumb.value = { left: el.offsetLeft, width: el.offsetWidth }
}

onMounted(measure)
watch([() => props.value, () => props.options, () => props.block], measure)

function pick(option: SegmentedOption) {
  if (props.disabled || option.disabled || option.value === props.value) return
  emit('input', option.value)
  emit('change', option.value)
}
</script>

<template>
  <div
    ref="root"
    class="i-segmented"
    :class="[`i-segmented--${size}`, { 'is-block': block }]"
    role="radiogroup"
  >
    <span
      v-show="thumb.width > 0"
      class="i-segmented__thumb"
      :style="{ transform: `translateX(${thumb.left}px)`, width: `${thumb.width}px` }"
      aria-hidden="true"
    />
    <button
      v-for="option in options"
      :key="option.value"
      class="i-segmented__item"
      :class="{
        'is-active': option.value === value,
        'is-disabled': disabled || option.disabled
      }"
      role="radio"
      :aria-checked="String(option.value === value)"
      :disabled="disabled || option.disabled"
      @click="pick(option)"
    >
      {{ option.label }}
    </button>
  </div>
</template>
