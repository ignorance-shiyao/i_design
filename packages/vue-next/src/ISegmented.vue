<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'

export interface SegmentedOption {
  label: string
  value: string | number
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    modelValue?: string | number | null
    options: SegmentedOption[]
    size?: 'md' | 'lg'
    block?: boolean
    disabled?: boolean
  }>(),
  { modelValue: null, size: 'md', block: false, disabled: false }
)

const emit = defineEmits<{ 'update:modelValue': [string | number]; change: [string | number] }>()

const root = ref<HTMLElement | null>(null)
const thumb = ref({ left: 0, width: 0 })

const activeIndex = computed(() => props.options.findIndex((o) => o.value === props.modelValue))

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
watch([() => props.modelValue, () => props.options, () => props.block], measure)

function pick(option: SegmentedOption) {
  if (props.disabled || option.disabled || option.value === props.modelValue) return
  emit('update:modelValue', option.value)
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
        'is-active': option.value === modelValue,
        'is-disabled': disabled || option.disabled
      }"
      role="radio"
      :aria-checked="option.value === modelValue"
      :disabled="disabled || option.disabled"
      @click="pick(option)"
    >
      {{ option.label }}
    </button>
  </div>
</template>
